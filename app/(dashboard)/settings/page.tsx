import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
        <p className="text-slate-500 mt-1">
          Gerencie suas preferências e configurações do sistema.
        </p>
      </div>

      <Tabs defaultValue="geral" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="geral">Geral</TabsTrigger>
          <TabsTrigger value="conta">Conta</TabsTrigger>
          <TabsTrigger value="seguranca">Segurança</TabsTrigger>
          <TabsTrigger value="integracao">Integrações</TabsTrigger>
        </TabsList>
        
        <TabsContent value="geral">
          <Card>
            <CardHeader>
              <CardTitle>Configurações Gerais</CardTitle>
              <CardDescription>Personalize as configurações básicas da aplicação</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium" htmlFor="app-name">
                  Nome da Aplicação
                </label>
                <Input id="app-name" defaultValue="EmailMax" />
              </div>
              
              <div className="space-y-1">
                <label className="text-sm font-medium" htmlFor="timezone">
                  Fuso Horário
                </label>
                <select 
                  id="timezone" 
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="UTC">UTC</option>
                  <option value="America/Sao_Paulo">America/São Paulo</option>
                  <option value="America/New_York">America/New York</option>
                  <option value="Europe/London">Europe/London</option>
                </select>
              </div>
              
              <div className="space-y-1">
                <label className="flex items-center space-x-2">
                  <input type="checkbox" className="rounded border-gray-300" defaultChecked />
                  <span className="text-sm font-medium">Ativar notificações por email</span>
                </label>
              </div>
              
              <Button className="mt-2">Salvar Alterações</Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="conta">
          <Card>
            <CardHeader>
              <CardTitle>Perfil e Conta</CardTitle>
              <CardDescription>Gerencie sua conta e informações pessoais</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium" htmlFor="nome">
                  Nome
                </label>
                <Input id="nome" defaultValue="Usuário" />
              </div>
              
              <div className="space-y-1">
                <label className="text-sm font-medium" htmlFor="email">
                  Email
                </label>
                <Input id="email" type="email" defaultValue="usuario@exemplo.com" />
              </div>
              
              <Button className="mt-2">Atualizar Perfil</Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="seguranca">
          <Card>
            <CardHeader>
              <CardTitle>Segurança</CardTitle>
              <CardDescription>Gerencie suas credenciais e configurações de segurança</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium" htmlFor="senha-atual">
                  Senha Atual
                </label>
                <Input id="senha-atual" type="password" />
              </div>
              
              <div className="space-y-1">
                <label className="text-sm font-medium" htmlFor="nova-senha">
                  Nova Senha
                </label>
                <Input id="nova-senha" type="password" />
              </div>
              
              <div className="space-y-1">
                <label className="text-sm font-medium" htmlFor="confirmar-senha">
                  Confirmar Nova Senha
                </label>
                <Input id="confirmar-senha" type="password" />
              </div>
              
              <Button className="mt-2">Alterar Senha</Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="integracao">
          <Card>
            <CardHeader>
              <CardTitle>Integrações</CardTitle>
              <CardDescription>Configure integrações com serviços externos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-md font-medium">Claude (Anthropic)</h3>
                <div className="space-y-1">
                  <label className="text-sm font-medium" htmlFor="claude-api-key">
                    API Key
                  </label>
                  <Input id="claude-api-key" type="password" defaultValue="••••••••••••••••" />
                </div>
                <Button variant="outline" size="sm">Testar Conexão</Button>
              </div>
              
              <div className="border-t border-slate-200 my-4 pt-4">
                <h3 className="text-md font-medium">Serviços SMTP</h3>
                <p className="text-sm text-slate-500 mb-2">
                  Configure servidores SMTP para envio de email
                </p>
                
                <div className="space-y-2">
                  <div className="space-y-1">
                    <label className="text-sm font-medium" htmlFor="smtp-host">
                      Servidor SMTP
                    </label>
                    <Input id="smtp-host" defaultValue="smtp.gmail.com" />
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-sm font-medium" htmlFor="smtp-port">
                      Porta
                    </label>
                    <Input id="smtp-port" defaultValue="587" />
                  </div>
                  
                  <Button className="mt-2">Salvar Configurações SMTP</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 