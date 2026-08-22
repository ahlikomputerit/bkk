import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { Plus, Edit, Trash2 } from "lucide-react"
import { getErrorMessage } from "@/lib/utils"

interface PKLPlacement {
  id?: string
  student_id: string
  company_id: string
  period_id: string
  mentor_teacher_id?: string
  start_date?: string
  end_date?: string
  status?: string
  jenis_pkl?: string
}

interface PKLCRUDProps {
  onDataChange: () => void
  editingPKL?: PKLPlacement | null
  onEditCancel?: () => void
}

export const PKLCRUD = ({ onDataChange, editingPKL, onEditCancel }: PKLCRUDProps) => {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [students, setStudents] = useState<any[]>([])
  const [companies, setCompanies] = useState<any[]>([])
  const [periods, setPeriods] = useState<any[]>([])
  const [teachers, setTeachers] = useState<any[]>([])
  const { toast } = useToast()
  
  const [formData, setFormData] = useState<PKLPlacement>({
    student_id: "",
    company_id: "",
    period_id: "",
    mentor_teacher_id: "",
    start_date: "",
    end_date: "",
    status: "ACTIVE",
    jenis_pkl: "REGULER"
  })

  useEffect(() => {
    fetchDropdownData()
  }, [])

  useEffect(() => {
    if (editingPKL) {
      setFormData(editingPKL)
      setOpen(true)
    }
  }, [editingPKL])

  const fetchDropdownData = async () => {
    try {
      const [studentsData, companiesData, periodsData, teachersData] = await Promise.all([
        supabase.from('students').select('id, nama, nis'),
        supabase.from('companies').select('id, nama'),
        supabase.from('pkl_periods').select('id, nama'),
        supabase.from('teachers').select('id, nama')
      ])

      const failedRequest = [studentsData, companiesData, periodsData, teachersData].find((result) => result.error)
      if (failedRequest?.error) throw failedRequest.error

      setStudents(studentsData.data || [])
      setCompanies(companiesData.data || [])
      setPeriods(periodsData.data || [])
      setTeachers(teachersData.data || [])
    } catch (error) {
      console.error('Error fetching dropdown data:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.student_id || !formData.company_id || !formData.period_id) {
      toast({
        title: "Data belum lengkap",
        description: "Siswa, perusahaan, dan periode wajib dipilih.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      if (editingPKL?.id) {
        // Update
        const { error } = await supabase
          .from('pkl_placements')
          .update(formData)
          .eq('id', editingPKL.id)
        
        if (error) throw error
        toast({ title: "Sukses", description: "Data PKL berhasil diupdate" })
      } else {
        // Create
        const { error } = await supabase
          .from('pkl_placements')
          .insert([formData])
        
        if (error) throw error
        toast({ title: "Sukses", description: "Data PKL baru berhasil ditambahkan" })
      }
      
      setOpen(false)
      setFormData({ 
        student_id: "", 
        company_id: "", 
        period_id: "", 
        mentor_teacher_id: "", 
        start_date: "", 
        end_date: "", 
        status: "ACTIVE", 
        jenis_pkl: "REGULER" 
      })
      onDataChange()
      if (onEditCancel) onEditCancel()
    } catch (error: unknown) {
      toast({ 
        title: "Error", 
        description: getErrorMessage(error, "Gagal menyimpan data PKL"),
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
        if (!nextOpen && editingPKL) onEditCancel?.()
      }}
    >
      <DialogTrigger asChild>
        {!editingPKL && (
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Tambah PKL
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingPKL ? "Edit PKL" : "Tambah PKL Baru"}
          </DialogTitle>
          <DialogDescription>
            {editingPKL ? "Ubah data penempatan PKL yang sudah ada" : "Tambahkan penempatan PKL baru"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="student_id">Siswa *</Label>
              <Select 
                value={formData.student_id} 
                onValueChange={(value) => setFormData({...formData, student_id: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Siswa" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.nama} - {student.nis}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
              <Label htmlFor="mentor_teacher_id">Guru Pembimbing</Label>
              <Select 
                value={formData.mentor_teacher_id} 
                onValueChange={(value) => setFormData({...formData, mentor_teacher_id: value})}
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
              <Label htmlFor="start_date">Tanggal Mulai</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                className="w-full"
              />
            </div>
            <div>
              <Label htmlFor="end_date">Tanggal Selesai</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                className="w-full"
              />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value) => setFormData({...formData, status: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Aktif</SelectItem>
                  <SelectItem value="COMPLETED">Selesai</SelectItem>
                  <SelectItem value="CANCELLED">Dibatalkan</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="jenis_pkl">Jenis PKL</Label>
              <Select 
                value={formData.jenis_pkl} 
                onValueChange={(value) => setFormData({...formData, jenis_pkl: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Jenis PKL" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="REGULER">Reguler</SelectItem>
                  <SelectItem value="MANDIRI">Mandiri</SelectItem>
                  <SelectItem value="INDUSTRI">Industri</SelectItem>
                </SelectContent>
              </Select>
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
              {loading ? "Menyimpan..." : editingPKL ? "Update" : "Simpan"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export const DeletePKLButton = ({ pklId, onDelete }: { pklId: string, onDelete: () => void }) => {
  const { toast } = useToast()
  
  const handleDelete = async () => {
    if (!confirm("Yakin ingin menghapus data PKL ini?")) return
    
    try {
      const { error } = await supabase
        .from('pkl_placements')
        .delete()
        .eq('id', pklId)
      
      if (error) throw error
      toast({ title: "Sukses", description: "Data PKL berhasil dihapus" })
      onDelete()
    } catch (error: unknown) {
      toast({ 
        title: "Error", 
        description: getErrorMessage(error, "Gagal menghapus data PKL"),
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