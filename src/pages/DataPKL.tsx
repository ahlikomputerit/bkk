import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, FileText, Building, Edit, Trash2 } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { PKLCRUD, DeletePKLButton } from "@/components/PKLCRUD"
import { CompanyCRUD, DeleteCompanyButton } from "@/components/CompanyCRUD"
import { normalizeText } from "@/lib/utils"

const DataPKL = () => {
  const [searchTerm, setSearchTerm] = useState("")
  const [pklData, setPklData] = useState<any[]>([])
  const [companies, setCompanies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editingPKL, setEditingPKL] = useState<any>(null)
  const [editingCompany, setEditingCompany] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<"pkl" | "companies">("pkl")

  useEffect(() => {
    if (activeTab === "pkl") {
      fetchPKLData()
    } else {
      fetchCompanies()
    }
  }, [activeTab])

  const fetchPKLData = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('pkl_placements')
        .select(`
          *,
          students!student_id (nama, nis, rombel),
          companies!company_id (nama),
          teachers!mentor_teacher_id (nama),
          pkl_periods!period_id (nama, start_date, end_date)
        `)

      if (error) throw error
      setPklData(data || [])
    } catch (error) {
      console.error('Error fetching PKL data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCompanies = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('nama')

      if (error) throw error
      setCompanies(data || [])
    } catch (error) {
      console.error('Error fetching companies:', error)
    } finally {
      setLoading(false)
    }
  }

  const normalizedSearchTerm = normalizeText(searchTerm)
  const filteredPKLData = pklData.filter(item =>
    normalizeText(item.students?.nama).includes(normalizedSearchTerm) ||
    normalizeText(item.companies?.nama).includes(normalizedSearchTerm) ||
    normalizeText(item.teachers?.nama).includes(normalizedSearchTerm)
  )

  const filteredCompanies = companies.filter(company =>
    normalizeText(company.nama).includes(normalizedSearchTerm) ||
    normalizeText(company.kategori).includes(normalizedSearchTerm) ||
    normalizeText(company.kecamatan).includes(normalizedSearchTerm)
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Data PKL</h1>
          <p className="text-muted-foreground">Kelola data praktik kerja lapangan dan perusahaan</p>
        </div>
        <div className="flex gap-2">
          {activeTab === "pkl" && (
            <PKLCRUD 
              onDataChange={fetchPKLData} 
              editingPKL={editingPKL}
              onEditCancel={() => setEditingPKL(null)}
            />
          )}
          {activeTab === "companies" && (
            <CompanyCRUD 
              onDataChange={fetchCompanies} 
              editingCompany={editingCompany}
              onEditCancel={() => setEditingCompany(null)}
            />
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-border">
        <Button 
          variant={activeTab === "pkl" ? "default" : "ghost"}
          onClick={() => setActiveTab("pkl")}
          className="rounded-b-none"
        >
          <FileText className="w-4 h-4 mr-2" />
          Data PKL
        </Button>
        <Button 
          variant={activeTab === "companies" ? "default" : "ghost"}
          onClick={() => setActiveTab("companies")}
          className="rounded-b-none"
        >
          <Building className="w-4 h-4 mr-2" />
          Data Perusahaan
        </Button>
      </div>

      {activeTab === "pkl" && (
        <Card className="border-0 shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              DATA PKL SISWA
            </CardTitle>
            <CardDescription>
              Data lengkap siswa yang sedang menjalani praktik kerja lapangan
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="relative flex-1 w-full sm:max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Cari siswa, perusahaan, atau guru..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-border focus:border-primary focus:ring-primary w-full"
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
                          <th className="text-left py-3 px-4 font-semibold text-muted-foreground text-sm border-r border-border">SISWA</th>
                          <th className="text-left py-3 px-4 font-semibold text-muted-foreground text-sm border-r border-border">PERUSAHAAN</th>
                          <th className="text-left py-3 px-4 font-semibold text-muted-foreground text-sm border-r border-border">PERIODE</th>
                          <th className="text-left py-3 px-4 font-semibold text-muted-foreground text-sm border-r border-border">GURU PEMBIMBING</th>
                          <th className="text-left py-3 px-4 font-semibold text-muted-foreground text-sm border-r border-border">STATUS</th>
                          <th className="text-left py-3 px-4 font-semibold text-muted-foreground text-sm">AKSI</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPKLData.map((item, index) => (
                          <tr key={item.id} className={`${index % 2 === 0 ? 'bg-card' : 'bg-muted/20'} hover:bg-muted/40 transition-colors`}>
                            <td className="py-3 px-4 border-r border-border">
                              <div>
                                <span className="font-medium text-foreground">{item.students?.nama}</span>
                                <p className="text-sm text-muted-foreground">{item.students?.nis} - {item.students?.rombel}</p>
                              </div>
                            </td>
                            <td className="py-3 px-4 border-r border-border">
                              <span className="text-foreground">{item.companies?.nama}</span>
                            </td>
                            <td className="py-3 px-4 border-r border-border text-sm text-muted-foreground">
                              {item.pkl_periods?.nama}
                              <p className="text-xs">{item.pkl_periods?.start_date} - {item.pkl_periods?.end_date}</p>
                            </td>
                            <td className="py-3 px-4 border-r border-border text-sm text-muted-foreground">
                              {item.teachers?.nama || "-"}
                            </td>
                            <td className="py-3 px-4 border-r border-border">
                              <Badge variant={item.status === 'ACTIVE' ? 'default' : item.status === 'COMPLETED' ? 'secondary' : 'destructive'}>
                                {item.status}
                              </Badge>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => setEditingPKL(item)}
                                >
                                  <Edit className="w-4 h-4 mr-1" />
                                  Edit
                                </Button>
                                <DeletePKLButton pklId={item.id} onDelete={fetchPKLData} />
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
                  {filteredPKLData.map((item) => (
                    <Card key={item.id} className="border border-border">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold text-foreground">{item.students?.nama}</h3>
                            <p className="text-sm text-muted-foreground">{item.students?.nis} - {item.students?.rombel}</p>
                          </div>
                          <Badge variant={item.status === 'ACTIVE' ? 'default' : item.status === 'COMPLETED' ? 'secondary' : 'destructive'}>
                            {item.status}
                          </Badge>
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Perusahaan: </span>
                            <span className="text-foreground">{item.companies?.nama}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Periode: </span>
                            <span className="text-foreground">{item.pkl_periods?.nama}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Guru Pembimbing: </span>
                            <span className="text-foreground">{item.teachers?.nama || "-"}</span>
                          </div>
                        </div>
                        
                        <div className="flex gap-2 mt-4 pt-3 border-t border-border">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setEditingPKL(item)}
                            className="flex-1"
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                          <DeletePKLButton pklId={item.id} onDelete={fetchPKLData} />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "companies" && (
        <Card className="border-0 shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="w-5 h-5 text-primary" />
              DATA PERUSAHAAN
            </CardTitle>
            <CardDescription>
              Data lengkap perusahaan mitra PKL
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="relative flex-1 w-full sm:max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Cari nama perusahaan atau kategori..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-border focus:border-primary focus:ring-primary w-full"
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
                          <th className="text-left py-3 px-4 font-semibold text-muted-foreground text-sm border-r border-border">NAMA PERUSAHAAN</th>
                          <th className="text-left py-3 px-4 font-semibold text-muted-foreground text-sm border-r border-border">KATEGORI</th>
                          <th className="text-left py-3 px-4 font-semibold text-muted-foreground text-sm border-r border-border">KECAMATAN</th>
                          <th className="text-left py-3 px-4 font-semibold text-muted-foreground text-sm border-r border-border">CONTACT</th>
                          <th className="text-left py-3 px-4 font-semibold text-muted-foreground text-sm">AKSI</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredCompanies.map((company, index) => (
                          <tr key={company.id} className={`${index % 2 === 0 ? 'bg-card' : 'bg-muted/20'} hover:bg-muted/40 transition-colors`}>
                            <td className="py-3 px-4 border-r border-border">
                              <span className="font-medium text-foreground">{company.nama}</span>
                            </td>
                            <td className="py-3 px-4 border-r border-border">
                              <Badge variant="outline">{company.kategori || "-"}</Badge>
                            </td>
                            <td className="py-3 px-4 border-r border-border text-sm text-muted-foreground">
                              {company.kecamatan || "-"}
                            </td>
                            <td className="py-3 px-4 border-r border-border text-sm text-muted-foreground">
                              <div>
                                <p>{company.contact_person || "-"}</p>
                                <p className="text-xs">{company.phone || ""}</p>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => setEditingCompany(company)}
                                >
                                  <Edit className="w-4 h-4 mr-1" />
                                  Edit
                                </Button>
                                <DeleteCompanyButton companyId={company.id} onDelete={fetchCompanies} />
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
                  {filteredCompanies.map((company) => (
                    <Card key={company.id} className="border border-border">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold text-foreground">{company.nama}</h3>
                            <p className="text-sm text-muted-foreground">{company.alamat}</p>
                          </div>
                          <Badge variant="outline">{company.kategori || "-"}</Badge>
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Kecamatan: </span>
                            <span className="text-foreground">{company.kecamatan || "-"}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Contact Person: </span>
                            <span className="text-foreground">{company.contact_person || "-"}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Telepon: </span>
                            <span className="text-foreground">{company.phone || "-"}</span>
                          </div>
                        </div>
                        
                        <div className="flex gap-2 mt-4 pt-3 border-t border-border">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setEditingCompany(company)}
                            className="flex-1"
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                          <DeleteCompanyButton companyId={company.id} onDelete={fetchCompanies} />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default DataPKL