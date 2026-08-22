import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Upload, FileText, Image, Settings, Download, Edit, Trash2, Save } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { generateSuratPengajuanPDF, generateSuratTugasPDF } from "@/lib/pdfGenerator"
import { supabase } from "@/integrations/supabase/client"
import { TemplateProcessor } from "@/lib/templateProcessor"
import {
  loadStoredWordTemplates,
  saveWordTemplates,
  setActiveWordTemplate,
  type WordTemplate,
} from "@/lib/templateStorage"

interface ConfigData {
  id?: string
  label: string
  value: string
  template: string
  type: string
}

interface ImageData {
  id: string
  name: string
  type: string
  active: boolean
  url?: string
}

const Konfigurasi = () => {
  const [configData, setConfigData] = useState<ConfigData[]>([])
  const [headerImages, setHeaderImages] = useState<ImageData[]>([])
  const [loading, setLoading] = useState(false)
  const [editingConfig, setEditingConfig] = useState<ConfigData | null>(null)
  const [editingImage, setEditingImage] = useState<ImageData | null>(null)
  const [templates, setTemplates] = useState<WordTemplate[]>([])
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    loadConfiguration()
    loadImages()
    loadTemplates()
  }, [])

  const loadConfiguration = async () => {
    try {
      // Load from localStorage first, fallback to default
      const saved = localStorage.getItem('configData')
      if (saved) {
        const parsedConfig = JSON.parse(saved)
        setConfigData(parsedConfig)
        return
      }
      
      const defaultConfig: ConfigData[] = [
        { id: "1", label: "ASPEK PENILAIAN", value: "18", template: "ASPmm", type: "numbering" },
        { id: "2", label: "PERUSAHAAN (DU/DI)", value: "2011", template: "DUDImm", type: "numbering" },
        { id: "3", label: "PEMBIMBING LAPANGAN", value: "479", template: "PBLmm", type: "numbering" },
        { id: "4", label: "NOMOR SURAT PENGAJUAN", value: "1", template: "(mm)", type: "numbering" },
        { id: "5", label: "NOMOR SURAT TUGAS", value: "203", template: "463.2/76 (N)/404.3.9/SMK KRIAN 1/R", type: "numbering" },
      ]
      setConfigData(defaultConfig)
      localStorage.setItem('configData', JSON.stringify(defaultConfig))
    } catch (error) {
      console.error('Error loading configuration:', error)
    }
  }

  const loadImages = async () => {
    try {
      // Load from localStorage first, fallback to default
      const saved = localStorage.getItem('headerImages')
      if (saved) {
        const parsedImages = JSON.parse(saved)
        setHeaderImages(parsedImages)
        return
      }
      
      const defaultImages: ImageData[] = [
        { id: "1", name: "SMK Krian 1 Header", type: "report-header", active: true },
        { id: "2", name: "Background Sertifikat Side A", type: "certificate-bg", active: false },
        { id: "3", name: "Background Sertifikat Side B", type: "certificate-bg", active: false },
      ]
      setHeaderImages(defaultImages)
      localStorage.setItem('headerImages', JSON.stringify(defaultImages))
    } catch (error) {
      console.error('Error loading images:', error)
    }
  }

  const saveConfiguration = async (config: ConfigData) => {
    try {
      setLoading(true)
      const updatedConfig = configData.map(item => 
        item.id === config.id ? config : item
      )
      setConfigData(updatedConfig)
      localStorage.setItem('configData', JSON.stringify(updatedConfig))
      
      toast({
        title: "Sukses",
        description: "Konfigurasi berhasil disimpan"
      })
      setEditingConfig(null)
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal menyimpan konfigurasi",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setLoading(true)
      // For demo purposes, we'll create a new image entry
      const newImage: ImageData = {
        id: Date.now().toString(),
        name: file.name,
        type: "custom",
        active: false,
        url: URL.createObjectURL(file)
      }
      
      const updatedImages = [...headerImages, newImage]
      setHeaderImages(updatedImages)
      localStorage.setItem('headerImages', JSON.stringify(updatedImages))
      
      toast({
        title: "Sukses",
        description: "Image berhasil diupload"
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal upload image",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const toggleImageActive = async (imageId: string) => {
    try {
      const updatedImages = headerImages.map(img => ({
        ...img,
        active: img.id === imageId ? !img.active : false
      }))
      setHeaderImages(updatedImages)
      localStorage.setItem('headerImages', JSON.stringify(updatedImages))
      
      toast({
        title: "Sukses", 
        description: "Status image berhasil diupdate"
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal update status image",
        variant: "destructive"
      })
    }
  }

  const deleteImage = async (imageId: string) => {
    if (!confirm("Yakin ingin menghapus image ini?")) return
    
    try {
      const updatedImages = headerImages.filter(img => img.id !== imageId)
      setHeaderImages(updatedImages)
      localStorage.setItem('headerImages', JSON.stringify(updatedImages))
      
      toast({
        title: "Sukses",
        description: "Image berhasil dihapus"
      })
    } catch (error) {
      toast({
        title: "Error", 
        description: "Gagal menghapus image",
        variant: "destructive"
      })
    }
  }

  const loadTemplates = () => {
    const storedTemplates = loadStoredWordTemplates()
    const templatesWithFiles = storedTemplates.map((template) => ({
      ...template,
      file: new File(
        [Uint8Array.from(window.atob(template.fileData), (character) => character.charCodeAt(0))],
        template.name,
        { type: template.fileType || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
      ),
    }))

    setTemplates(templatesWithFiles)
    const activeId = localStorage.getItem('activeTemplateId')
    setActiveTemplateId(activeId || templatesWithFiles[0]?.id || null)
  }

  const handleTemplateUpload = async (file: File) => {
    if (!TemplateProcessor.validateTemplateFile(file)) {
      toast({
        title: "Error",
        description: "File harus berformat .docx atau .doc",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)
      
      // Extract variables from template
      const variables = await TemplateProcessor.extractVariablesFromTemplate(file)
      
      const newTemplate: WordTemplate = {
        id: Date.now().toString(),
        name: file.name,
        file: file,
        uploadedAt: new Date().toISOString(),
        variables: variables,
      }

      const updatedTemplates = [...templates, newTemplate]
      setTemplates(updatedTemplates)
      
      await saveWordTemplates(updatedTemplates)
      
      // Set as active if it's the first template
      if (updatedTemplates.length === 1) {
        setActiveTemplateId(newTemplate.id)
        setActiveWordTemplate(newTemplate.id)
      }

      toast({
        title: "Sukses",
        description: "Template berhasil diupload",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal mengupload template",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const setActiveTemplate = (templateId: string) => {
    setActiveTemplateId(templateId)
    setActiveWordTemplate(templateId)
    toast({
      title: "Sukses",
      description: "Template berhasil diaktifkan",
    })
  }

  const deleteTemplate = async (templateId: string) => {
    const updatedTemplates = templates.filter(t => t.id !== templateId)
    setTemplates(updatedTemplates)
    
    await saveWordTemplates(updatedTemplates)

    if (activeTemplateId === templateId) {
      const newActiveId = updatedTemplates.length > 0 ? updatedTemplates[0].id : null
      setActiveTemplateId(newActiveId)
      setActiveWordTemplate(newActiveId)
    }

    toast({
      title: "Sukses",
      description: "Template berhasil dihapus",
    })
  }

  const previewTemplate = async (template: WordTemplate) => {
    try {
      const htmlContent = await TemplateProcessor.convertWordToHtml(template.file)
      const newWindow = window.open('', '_blank')
      newWindow?.document.write(`
        <html>
          <head><title>Preview Template - ${template.name}</title></head>
          <body style="padding: 20px; font-family: Arial, sans-serif;">
            <h2>Preview: ${template.name}</h2>
            <hr>
            ${htmlContent}
          </body>
        </html>
      `)
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal menampilkan preview template",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Konfigurasi</h1>
        <p className="text-muted-foreground">Kelola konfigurasi sistem dan template dokumen</p>
      </div>

      <Card className="border-0 shadow-soft">
        <CardContent className="p-0">
          <Tabs defaultValue="numbering" className="w-full">
            <div className="border-b bg-muted/30">
            <TabsList className="grid w-full grid-cols-3 bg-transparent h-auto p-0">
              <TabsTrigger 
                value="numbering" 
                className="data-[state=active]:bg-card data-[state=active]:shadow-sm rounded-none border-b-2 border-transparent data-[state=active]:border-primary py-4"
              >
                <Settings className="w-4 h-4 mr-2" />
                PENOMORAN
              </TabsTrigger>
              <TabsTrigger 
                value="images"
                className="data-[state=active]:bg-card data-[state=active]:shadow-sm rounded-none border-b-2 border-transparent data-[state=active]:border-primary py-4"
              >
                <Image className="w-4 h-4 mr-2" />
                IMAGES
              </TabsTrigger>
              <TabsTrigger 
                value="templates"
                className="data-[state=active]:bg-card data-[state=active]:shadow-sm rounded-none border-b-2 border-transparent data-[state=active]:border-primary py-4"
              >
                <FileText className="w-4 h-4 mr-2" />
                TEMPLATE DOKUMEN
              </TabsTrigger>
            </TabsList>
            </div>

            <TabsContent value="numbering" className="p-6 space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Konfigurasi Penomoran</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-semibold text-muted-foreground">COUNTER</th>
                        <th className="text-left py-3 px-4 font-semibold text-muted-foreground">TEMPLATE</th>
                        <th className="text-left py-3 px-4 font-semibold text-muted-foreground">AKSI</th>
                      </tr>
                    </thead>
                    <tbody>
                      {configData.map((item, index) => (
                        <tr key={index} className="border-b hover:bg-muted/30">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-foreground">{item.label}</span>
                              <Input 
                                value={item.value} 
                                className="w-20 h-8 text-sm"
                                onChange={(e) => {
                                  const updatedConfig = configData.map(config => 
                                    config.id === item.id ? {...config, value: e.target.value} : config
                                  )
                                  setConfigData(updatedConfig)
                                }}
                              />
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <Input 
                              value={item.template} 
                              className="max-w-xs h-8 text-sm"
                              onChange={(e) => {
                                const updatedConfig = configData.map(config => 
                                  config.id === item.id ? {...config, template: e.target.value} : config
                                )
                                setConfigData(updatedConfig)
                              }}
                            />
                          </td>
                          <td className="py-3 px-4">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => saveConfiguration(item)}
                              disabled={loading}
                            >
                              <Save className="w-4 h-4 mr-1" />
                              Simpan
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="images" className="p-6 space-y-6">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-foreground">Template Images</h3>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Image
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  {headerImages.map((image) => (
                    <Card key={image.id} className="border-border shadow-sm">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">{image.name}</CardTitle>
                          <div className="flex items-center gap-2">
                            <Button
                              variant={image.active ? "default" : "outline"}
                              size="sm"
                              onClick={() => toggleImageActive(image.id)}
                            >
                              {image.active ? "Active" : "Set Active"}
                            </Button>
                            {image.type === "custom" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => deleteImage(image.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="aspect-video bg-gradient-to-br from-accent/20 to-accent/10 rounded-lg flex items-center justify-center border-2 border-dashed border-accent/30">
                          {image.url ? (
                            <img 
                              src={image.url} 
                              alt={image.name}
                              className="max-w-full max-h-full object-contain rounded"
                            />
                          ) : image.type === "report-header" ? (
                            <div className="text-center p-8">
                              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FileText className="w-8 h-8 text-primary" />
                              </div>
                              <h4 className="font-bold text-lg text-foreground mb-2">SMK KRIAN 1</h4>
                              <p className="text-sm text-muted-foreground">Jl. Kyai Mojo, Krian, Sidoarjo</p>
                              <p className="text-sm text-muted-foreground">PERIODE 2023/2024 (GASAL)</p>
                            </div>
                          ) : (
                            <div className="text-center">
                              <div className="w-32 h-32 bg-accent/30 rounded-lg flex items-center justify-center mx-auto mb-4">
                                <Image className="w-12 h-12 text-accent-foreground" />
                              </div>
                              <p className="text-sm text-muted-foreground">Certificate Background</p>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-4">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setEditingImage(image)}
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                           <Button 
                             variant="outline" 
                             size="sm"
                             onClick={() => {
                               if (image.url) {
                                 const link = document.createElement('a')
                                 link.href = image.url
                                 link.download = image.name || 'image'
                                 document.body.appendChild(link)
                                 link.click()
                                 document.body.removeChild(link)
                               } else {
                                 toast({
                                   title: "Error",
                                   description: "Image tidak dapat didownload",
                                   variant: "destructive"
                                 })
                               }
                             }}
                           >
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="templates" className="p-6 space-y-6">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-foreground">Template Surat Pengajuan PKL</h3>
                  <div className="flex gap-2">
                    <div className="relative">
                      <input
                        type="file"
                        accept=".docx,.doc"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            handleTemplateUpload(file)
                          }
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <Button variant="outline" size="sm" disabled={loading}>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Template Word
                      </Button>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        // Generate PDF Surat Pengajuan
                        const doc = generateSuratPengajuanPDF("Contoh Perusahaan", "Jl. Contoh No. 123")
                        doc.save("Template_Surat_Pengajuan_PKL.pdf")
                        
                        toast({
                          title: "Sukses",
                          description: "Template Surat Pengajuan PDF berhasil didownload"
                        })
                      }}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download PDF
                    </Button>
                  </div>
                </div>

                {/* Template List */}
                <div className="space-y-4">
                  <h4 className="text-lg font-medium">Template yang Tersedia</h4>
                  {templates.length === 0 ? (
                    <Card className="border-border shadow-sm">
                      <CardContent className="p-6 text-center">
                        <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">Belum ada template</h3>
                        <p className="text-muted-foreground mb-4">Upload file Word (.docx) untuk membuat template surat pengajuan PKL</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid gap-4">
                      {templates.map((template) => (
                        <Card key={template.id} className={`border-border shadow-sm ${activeTemplateId === template.id ? 'ring-2 ring-primary' : ''}`}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                                  <FileText className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                  <h4 className="font-medium">{template.name}</h4>
                                  <p className="text-sm text-muted-foreground">
                                    Diupload {new Date(template.uploadedAt).toLocaleDateString()}
                                  </p>
                                  {activeTemplateId === template.id && (
                                    <Badge variant="default" className="text-xs">Template Aktif</Badge>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => previewTemplate(template)}
                                >
                                  Preview
                                </Button>
                                {activeTemplateId !== template.id && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setActiveTemplate(template.id)}
                                  >
                                    Aktifkan
                                  </Button>
                                )}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => deleteTemplate(template.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                            {template.variables.length > 0 && (
                              <div className="mt-3 pt-3 border-t">
                                <p className="text-sm font-medium mb-2">Variabel dalam template:</p>
                                <div className="flex flex-wrap gap-1">
                                  {template.variables.map((variable) => (
                                    <Badge key={variable} variant="secondary" className="text-xs">
                                      ${variable}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Edit Image Dialog */}
      <Dialog open={!!editingImage} onOpenChange={() => setEditingImage(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Image</DialogTitle>
          </DialogHeader>
          {editingImage && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="imageName">Nama Image</Label>
                <Input
                  id="imageName"
                  value={editingImage.name}
                  onChange={(e) => setEditingImage({...editingImage, name: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="imageFile">Ganti File</Label>
                <Input
                  id="imageFile"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      setEditingImage({
                        ...editingImage,
                        url: URL.createObjectURL(file)
                      })
                    }
                  }}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditingImage(null)}>
                  Batal
                </Button>
                  <Button onClick={() => {
                  if (editingImage) {
                    const updatedImages = headerImages.map(img => 
                      img.id === editingImage.id ? editingImage : img
                    )
                    setHeaderImages(updatedImages)
                    localStorage.setItem('headerImages', JSON.stringify(updatedImages))
                    setEditingImage(null)
                    toast({
                      title: "Sukses",
                      description: "Image berhasil diupdate"
                    })
                  }
                }}>
                  Simpan
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Konfigurasi