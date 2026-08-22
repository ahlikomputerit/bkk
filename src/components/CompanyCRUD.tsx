import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { Plus, Edit, Trash2 } from "lucide-react"
import { getErrorMessage } from "@/lib/utils"

interface Company {
  id?: string
  nama: string
  alamat?: string
  phone?: string
  email?: string
  contact_person?: string
  kategori?: string
  kecamatan?: string
}

interface CompanyCRUDProps {
  onDataChange: () => void
  editingCompany?: Company | null
  onEditCancel?: () => void
}

const kategoriOptions = [
  "Teknologi Informasi",
  "Manufaktur",
  "Pendidikan",
  "Kesehatan",
  "Perdagangan",
  "Jasa",
  "Pemerintahan",
  "Lainnya"
]

const kecamatanOptions = [
  "Krian",
  "Balongpanggang",
  "Taman",
  "Sukodono",
  "Wringinanom",
  "Cerme",
  "Benjeng",
  "Menganti",
  "Kedamean",
  "Driyorejo"
]

export const CompanyCRUD = ({ onDataChange, editingCompany, onEditCancel }: CompanyCRUDProps) => {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  
  const [formData, setFormData] = useState<Company>({
    nama: "",
    alamat: "",
    phone: "",
    email: "",
    contact_person: "",
    kategori: "",
    kecamatan: ""
  })

  useEffect(() => {
    if (editingCompany) {
      setFormData(editingCompany)
      setOpen(true)
    }
  }, [editingCompany])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.nama.trim()) {
      toast({
        title: "Data belum lengkap",
        description: "Nama perusahaan wajib diisi.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      if (editingCompany?.id) {
        // Update
        const { error } = await supabase
          .from('companies')
          .update(formData)
          .eq('id', editingCompany.id)
        
        if (error) throw error
        toast({ title: "Sukses", description: "Data perusahaan berhasil diupdate" })
      } else {
        // Create
        const { error } = await supabase
          .from('companies')
          .insert([formData])
        
        if (error) throw error
        toast({ title: "Sukses", description: "Perusahaan baru berhasil ditambahkan" })
      }
      
      setOpen(false)
      setFormData({ nama: "", alamat: "", phone: "", email: "", contact_person: "", kategori: "", kecamatan: "" })
      onDataChange()
      if (onEditCancel) onEditCancel()
    } catch (error: unknown) {
      toast({ 
        title: "Error", 
        description: getErrorMessage(error, "Gagal menyimpan data perusahaan"),
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (!nextOpen && editingCompany) onEditCancel?.()
      }}
    >
      <DialogTrigger asChild>
        {!editingCompany && (
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Tambah Perusahaan
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingCompany ? "Edit Perusahaan" : "Tambah Perusahaan Baru"}
          </DialogTitle>
          <DialogDescription>
            {editingCompany ? "Ubah data perusahaan yang sudah ada" : "Tambahkan perusahaan baru ke sistem"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Label htmlFor="nama">Nama Perusahaan *</Label>
              <Input
                id="nama"
                value={formData.nama}
                onChange={(e) => setFormData({...formData, nama: e.target.value})}
                required
                className="w-full"
              />
            </div>
            <div>
              <Label htmlFor="kategori">Kategori</Label>
              <Select 
                value={formData.kategori} 
                onValueChange={(value) => setFormData({...formData, kategori: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Kategori" />
                </SelectTrigger>
                <SelectContent>
                  {kategoriOptions.map((kategori) => (
                    <SelectItem key={kategori} value={kategori}>{kategori}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="kecamatan">Kecamatan</Label>
              <Select 
                value={formData.kecamatan} 
                onValueChange={(value) => setFormData({...formData, kecamatan: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Kecamatan" />
                </SelectTrigger>
                <SelectContent>
                  {kecamatanOptions.map((kecamatan) => (
                    <SelectItem key={kecamatan} value={kecamatan}>{kecamatan}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="alamat">Alamat</Label>
              <Textarea
                id="alamat"
                value={formData.alamat}
                onChange={(e) => setFormData({...formData, alamat: e.target.value})}
                className="w-full"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="phone">Telepon</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="w-full"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full"
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="contact_person">Contact Person</Label>
              <Input
                id="contact_person"
                value={formData.contact_person}
                onChange={(e) => setFormData({...formData, contact_person: e.target.value})}
                className="w-full"
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => {
              setOpen(false)
              if (onEditCancel) onEditCancel()
            }}>
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Menyimpan..." : editingCompany ? "Update" : "Simpan"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export const DeleteCompanyButton = ({ companyId, onDelete }: { companyId: string, onDelete: () => void }) => {
  const { toast } = useToast()
  
  const handleDelete = async () => {
    if (!confirm("Yakin ingin menghapus perusahaan ini?")) return
    
    try {
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', companyId)
      
      if (error) throw error
      toast({ title: "Sukses", description: "Perusahaan berhasil dihapus" })
      onDelete()
    } catch (error: unknown) {
      toast({ 
        title: "Error", 
        description: getErrorMessage(error, "Gagal menghapus perusahaan"),
        variant: "destructive"
      })
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleDelete}>
      <Trash2 className="w-4 h-4 mr-2" />
      Hapus
    </Button>
  )
}