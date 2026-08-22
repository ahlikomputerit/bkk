import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Truck, Edit, FileText, Calendar, Plus, Download, Trash2 } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { generateSuratPengajuanPDF, generateSuratTugasPDF } from "@/lib/pdfGenerator"
import { TemplateProcessor, TemplateVariables } from "@/lib/templateProcessor"
import {
  createFileFromStoredWordTemplate,
  getActiveStoredWordTemplate,
  loadStoredWordTemplates,
  type StoredWordTemplate,
} from "@/lib/templateStorage"
import { getErrorMessage, normalizeText, safeFileName } from "@/lib/utils"

interface PickupDelivery {
  id?: string
  company_id: string
  period_id: string
  guru_pendamping_id?: string
  tanggal_penjemputan?: string
  tanggal_pengantaran?: string
  status: string
  kelompok?: string
}

interface PickupDeliveryView extends PickupDelivery {
  companies?: { nama?: string; alamat?: string }
  pkl_periods?: { nama?: string; start_date?: string; end_date?: string }
  teachers?: { nama?: string }
}

const Pengantaran = () => {
  const [searchTerm, setSearchTerm] = useState("")
  const [pengantaran, setPengantaran] = useState<PickupDeliveryView[]>([])
  const [companies, setCompanies] = useState<Array<{ id: string; nama: string }>>([])
  const [periods, setPeriods] = useState<Array<{ id: string; nama: string; start_date: string; end_date: string }>>([])
  const [teachers, setTeachers] = useState<Array<{ id: string; nama: string }>>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<PickupDeliveryView | null>(null)
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false)
  const [configTemplates, setConfigTemplates] = useState<StoredWordTemplate[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("")
  const { toast } = useToast()

  const [formData, setFormData] = useState<PickupDelivery>({
    company_id: "",
    period_id: "",
    guru_pendamping_id: "",
    tanggal_penjemputan: "",
    tanggal_pengantaran: "",
    status: "PLANNED",
    kelompok: ""
  })

  useEffect(() => {
    fetchData()
    loadConfigTemplates()
  }, [])

  const loadConfigTemplates = () => {
    setConfigTemplates(loadStoredWordTemplates())
  }

  const fetchData = async () => {
    try {
      const [deliveryData, companiesData, periodsData, teachersData] = await Promise.all([
        supabase.from('pickup_delivery').select(`
          *,
          companies (nama, alamat),
          pkl_periods (nama, start_date, end_date),
          teachers (nama)
        `),
        supabase.from('companies').select('id, nama'),
        supabase.from('pkl_periods').select('id, nama, start_date, end_date'),
        supabase.from('teachers').select('id, nama')
      ])

      const failedRequest = [deliveryData, companiesData, periodsData, teachersData].find((result) => result.error)
      if (failedRequest?.error) throw failedRequest.error

      setPengantaran(deliveryData.data || [])
      setCompanies(companiesData.data || [])
      setPeriods(periodsData.data || [])
      setTeachers(teachersData.data || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.company_id || !formData.period_id) {
      toast({
        title: "Data belum lengkap",
        description: "Perusahaan dan periode wajib dipilih.",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)
      
      if (editingItem?.id) {
        const { error } = await supabase
          .from('pickup_delivery')
          .update(formData)
          .eq('id', editingItem.id)
        
        if (error) throw error
        toast({ title: "Sukses", description: "Data pengantaran berhasil diupdate" })
      } else {
        const { error } = await supabase
          .from('pickup_delivery')
          .insert([formData])
        
        if (error) throw error
        toast({ title: "Sukses", description: "Data pengantaran berhasil ditambahkan" })
      }
      
      setDialogOpen(false)
      setEditingItem(null)
      resetForm()
      fetchData()
    } catch (error: unknown) {
      toast({ 
        title: "Error", 
        description: getErrorMessage(error, "Gagal menyimpan data pengantaran"),
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (item: PickupDeliveryView) => {
    setEditingItem(item)
    setFormData({
      company_id: item.company_id || "",
      period_id: item.period_id || "",
      guru_pendamping_id: item.guru_pendamping_id || "",
      tanggal_penjemputan: item.tanggal_penjemputan || "",
      tanggal_pengantaran: item.tanggal_pengantaran || "", 
      status: item.status || "PLANNED",
      kelompok: item.kelompok || ""
    })
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus data pengantaran ini?")) return
    
    try {
      const { error } = await supabase
        .from('pickup_delivery')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      toast({ title: "Sukses", description: "Data pengantaran berhasil dihapus" })
      fetchData()
    } catch (error: unknown) {
      toast({ 
        title: "Error", 
        description: getErrorMessage(error, "Gagal menghapus data pengantaran"),
        variant: "destructive"
      })
    }
  }

  const resetForm = () => {
    setFormData({
      company_id: "",
      period_id: "",
      guru_pendamping_id: "",
      tanggal_penjemputan: "",
      tanggal_pengantaran: "",
      status: "PLANNED",
      kelompok: ""
    })
  }

  const getConfigData = (...keys: string[]): string => {
    try {
      const saved = localStorage.getItem('configData')
      if (!saved) return ''

      const config: unknown = JSON.parse(saved)
      if (!Array.isArray(config)) return ''

      const normalizedKeys = keys.map(normalizeText)
      const item = config.find((entry): entry is { label: string; value?: unknown } => {
        if (!entry || typeof entry !== 'object') return false
        const candidate = entry as { label?: unknown; value?: unknown }
        return typeof candidate.label === 'string' && normalizedKeys.includes(normalizeText(candidate.label))
      })

      return typeof item?.value === 'string' ? item.value : String(item?.value ?? '')
    } catch (error) {
      console.error('Error getting config:', error)
      return ''
    }
  }

  const generateSuratPengajuan = async (item: PickupDeliveryView) => {
    const companyName = item.companies?.nama || 'Perusahaan'
    const doc = generateSuratPengajuanPDF(companyName, item.companies?.alamat || '')
    doc.save(`Surat_Pengajuan_${safeFileName(companyName, 'Perusahaan')}.pdf`)
    
    toast({
      title: "Sukses",
      description: "Surat Pengajuan PDF berhasil di-generate"
    })
  }

  const generateFromTemplate = async (item: PickupDeliveryView | null) => {
    if (!item) {
      toast({ title: "Data pengantaran tidak tersedia", variant: "destructive" })
      return
    }

    if (!selectedTemplateId) {
      toast({ title: "Pilih template terlebih dahulu", variant: "destructive" });
      return;
    }

    try {
      const template = configTemplates.find(t => t.id === selectedTemplateId);
      if (!template) {
        toast({ title: "Template tidak ditemukan", variant: "destructive" });
        return;
      }

      const templateFile = createFileFromStoredWordTemplate(template)

      // Get current student data for this company/period
      const { data: placements, error: placementsError } = await supabase
        .from('pkl_placements')
        .select(`
          id,
          students (nama, rombel, nis)
        `)
        .eq('company_id', item.company_id)
        .eq('period_id', item.period_id)

      if (placementsError) throw placementsError

      const siswaData = placements?.map((placement, index) => ({
        no: index + 1,
        nama: placement.students?.nama || '',
        kelas: placement.students?.rombel || '',
        hp: '-' // HP tidak tersedia di database
      })) || [];

      const variables: TemplateVariables = {
        KOTA: getConfigData('KOTA') || "Sidoarjo",
        TANGGAL: new Date().toISOString(),
        NOMORSURAT: getConfigData('NOMOR_SURAT', 'NOMOR SURAT PENGAJUAN') || `001/PKL/${new Date().getFullYear()}`,
        NAMAPERUSAHAAN: item.companies?.nama || "",
        ALAMATPERUSAHAAN: item.companies?.alamat || "",
        COL_NO: "No",
        COL_NAMA: "Nama Siswa",
        COL_KELAS: "Kelas", 
        COL_HP: "No. HP",
        siswaData
      };

      const processedDoc = await TemplateProcessor.processWordTemplate(templateFile, variables);
      
      // Download processed Word document
      const url = URL.createObjectURL(processedDoc);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Surat_Pengajuan_PKL_${safeFileName(item.companies?.nama, 'Template')}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({ title: "Surat pengajuan berhasil dibuat dari template" });
      setTemplateDialogOpen(false);
      setSelectedTemplateId("");
    } catch (error) {
      console.error('Error generating from template:', error);
      toast({ title: "Gagal membuat surat dari template", variant: "destructive" });
    }
  };

  const generateSuratTugas = (companyName: string, teacherName?: string, teacherNip?: string) => {
    const doc = generateSuratTugasPDF(companyName, teacherName, teacherNip)
    doc.save(`Surat_Tugas_${companyName.replace(/\s+/g, '_')}.pdf`)
    
    toast({
      title: "Sukses", 
      description: "Surat Tugas PDF berhasil di-generate"
    })
  }

  const normalizedSearchTerm = normalizeText(searchTerm)
  const filteredData = pengantaran.filter(item =>
    normalizeText(item.companies?.nama).includes(normalizedSearchTerm) ||
    normalizeText(item.kelompok).includes(normalizedSearchTerm)
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Pengantaran Siswa PKL</h1>
          <p className="text-muted-foreground">Kelola pengantaran siswa ke perusahaan</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingItem(null)
                resetForm()
              }}>
                <Plus className="w-4 h-4 mr-2" />
                Tambah Pengantaran
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingItem ? "Edit Pengantaran" : "Tambah Pengantaran Baru"}
                </DialogTitle>
                <DialogDescription>
                  {editingItem ? "Ubah data pengantaran yang sudah ada" : "Tambahkan data pengantaran siswa PKL"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="company_id">Perusahaan *</Label>
                    <Select 
                      value={formData.company_id} 
                      onValueChange={(value) => setFormData({...formData, company_id: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih Perusahaan" />
                      </SelectTrigger>
                      <SelectContent>
                        {companies.map((company) => (
                          <SelectItem key={company.id} value={company.id}>
                            {company.nama}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="period_id">Periode *</Label>
                    <Select 
                      value={formData.period_id} 
                      onValueChange={(value) => setFormData({...formData, period_id: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih Periode" />
                      </SelectTrigger>
                      <SelectContent>
                        {periods.map((period) => (
                          <SelectItem key={period.id} value={period.id}>
                            {period.nama}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="guru_pendamping_id">Guru Pendamping</Label>
                    <Select 
                      value={formData.guru_pendamping_id} 
                      onValueChange={(value) => setFormData({...formData, guru_pendamping_id: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih Guru" />
                      </SelectTrigger>
                      <SelectContent>
                        {teachers.map((teacher) => (
                          <SelectItem key={teacher.id} value={teacher.id}>
                            {teacher.nama}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="kelompok">Kelompok</Label>
                    <Input
                      id="kelompok"
                      value={formData.kelompok}
                      onChange={(e) => setFormData({...formData, kelompok: e.target.value})}
                      placeholder="Nama kelompok"
                    />
                  </div>
                  <div>
                    <Label htmlFor="tanggal_penjemputan">Tanggal Penjemputan</Label>
                    <Input
                      id="tanggal_penjemputan"
                      type="date"
                      value={formData.tanggal_penjemputan}
                      onChange={(e) => setFormData({...formData, tanggal_penjemputan: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="tanggal_pengantaran">Tanggal Pengantaran</Label>
                    <Input
                      id="tanggal_pengantaran"
                      type="date"
                      value={formData.tanggal_pengantaran}
                      onChange={(e) => setFormData({...formData, tanggal_pengantaran: e.target.value})}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="status">Status</Label>
                    <Select 
                      value={formData.status} 
                      onValueChange={(value) => setFormData({...formData, status: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PLANNED">Direncanakan</SelectItem>
                        <SelectItem value="IN_PROGRESS">Sedang Berlangsung</SelectItem>
                        <SelectItem value="COMPLETED">Selesai</SelectItem>
                        <SelectItem value="CANCELLED">Dibatalkan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Batal
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Menyimpan..." : editingItem ? "Update" : "Simpan"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Template Dialog */}
          <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Generate Surat Pengajuan dari Template</DialogTitle>
                <DialogDescription>
                  Pilih template yang akan digunakan untuk membuat surat pengajuan PKL
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {configTemplates.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">Belum ada template yang tersedia.</p>
                    <Button variant="outline" onClick={() => window.open('/konfigurasi', '_blank')}>
                      Kelola Template di Konfigurasi
                    </Button>
                  </div>
                ) : (
                  <>
                    <div>
                      <Label htmlFor="template-select">Pilih Template</Label>
                      <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih template yang akan digunakan" />
                        </SelectTrigger>
                        <SelectContent>
                          {configTemplates.map((template) => (
                            <SelectItem key={template.id} value={template.id}>
                              {template.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedTemplateId && (
                      <div className="bg-blue-50 p-3 rounded-md">
                        <h4 className="font-semibold text-sm text-blue-800">Informasi Template:</h4>
                        <ul className="text-xs text-blue-600 mt-1 space-y-1">
                          <li>• Data siswa akan diambil dari penempatan PKL untuk perusahaan ini</li>
                          <li>• Konfigurasi kota dan nomor surat diambil dari pengaturan</li>
                          <li>• File hasil akan berformat .docx</li>
                        </ul>
                      </div>
                    )}

                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => {
                        setTemplateDialogOpen(false);
                        setSelectedTemplateId("");
                      }}>
                        Batal
                      </Button>
                      <Button 
                        onClick={() => generateFromTemplate(editingItem)}
                        disabled={!selectedTemplateId}
                      >
                        Generate Surat
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="border-0 shadow-soft">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-primary" />
                PENGANTARAN
              </CardTitle>
              <CardDescription>
                Data pengantaran siswa ke perusahaan mitra
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Cari nama perusahaan atau kelompok..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-border focus:border-primary focus:ring-primary"
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden lg:block border border-border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left py-3 px-4 font-semibold text-muted-foreground text-sm border-r border-border">PERUSAHAAN</th>
                        <th className="text-left py-3 px-4 font-semibold text-muted-foreground text-sm border-r border-border">PERIODE</th>
                        <th className="text-left py-3 px-4 font-semibold text-muted-foreground text-sm border-r border-border">GURU PENDAMPING</th>
                        <th className="text-left py-3 px-4 font-semibold text-muted-foreground text-sm border-r border-border">KELOMPOK</th>
                        <th className="text-left py-3 px-4 font-semibold text-muted-foreground text-sm border-r border-border">STATUS</th>
                        <th className="text-left py-3 px-4 font-semibold text-muted-foreground text-sm">AKSI</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredData.map((item, index) => (
                        <tr key={item.id} className={`${index % 2 === 0 ? 'bg-card' : 'bg-muted/20'} hover:bg-muted/40 transition-colors`}>
                          <td className="py-3 px-4 border-r border-border">
                            <span className="font-medium text-foreground">{item.companies?.nama}</span>
                          </td>
                          <td className="py-3 px-4 border-r border-border text-sm text-muted-foreground">
                            {item.pkl_periods?.nama}
                            <p className="text-xs">{item.pkl_periods?.start_date} - {item.pkl_periods?.end_date}</p>
                          </td>
                          <td className="py-3 px-4 border-r border-border text-sm text-muted-foreground">
                            {item.teachers?.nama || "-"}
                          </td>
                          <td className="py-3 px-4 border-r border-border text-sm text-muted-foreground">
                            {item.kelompok || "-"}
                          </td>
                          <td className="py-3 px-4 border-r border-border">
                            <Badge variant={
                              item.status === 'COMPLETED' ? 'default' : 
                              item.status === 'IN_PROGRESS' ? 'secondary' : 
                              item.status === 'CANCELLED' ? 'destructive' : 'outline'
                            }>
                              {item.status}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex gap-1">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleEdit(item)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => generateSuratPengajuan(item)}
                                title="Generate PDF"
                              >
                                <FileText className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  setEditingItem(item);
                                  setSelectedTemplateId(getActiveStoredWordTemplate(configTemplates)?.id || "");
                                  setTemplateDialogOpen(true);
                                }}
                                title="Generate dari Template"
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => generateSuratTugas(item.companies?.nama, item.teachers?.nama)}
                              >
                                <Calendar className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleDelete(item.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile Card View */}
              <div className="lg:hidden space-y-4">
                {filteredData.map((item) => (
                  <Card key={item.id} className="border border-border">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold text-foreground">{item.companies?.nama}</h3>
                          <p className="text-sm text-muted-foreground">{item.pkl_periods?.nama}</p>
                        </div>
                        <Badge variant={
                          item.status === 'COMPLETED' ? 'default' : 
                          item.status === 'IN_PROGRESS' ? 'secondary' : 
                          item.status === 'CANCELLED' ? 'destructive' : 'outline'
                        }>
                          {item.status}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Guru Pendamping: </span>
                          <span className="text-foreground">{item.teachers?.nama || "-"}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Kelompok: </span>
                          <span className="text-foreground">{item.kelompok || "-"}</span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 mt-4 pt-3 border-t border-border">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleEdit(item)}
                          className="flex-1"
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => generateSuratPengajuan(item)}
                          title="Generate PDF"
                        >
                          <FileText className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setEditingItem(item);
                            setTemplateDialogOpen(true);
                          }}
                          title="Generate dari Template"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => generateSuratTugas(item.companies?.nama, item.teachers?.nama)}
                        >
                          <Calendar className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleDelete(item.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {filteredData.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Belum ada data pengantaran. Klik "Tambah Pengantaran" untuk menambah data.
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default Pengantaran