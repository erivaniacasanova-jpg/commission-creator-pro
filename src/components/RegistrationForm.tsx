import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CheckCircle2, ChevronRight, ChevronLeft, User, MapPin, Smartphone, Shield, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface FormData {
  cpf: string;
  birth: string;
  name: string;
  email: string;
  phone: string;
  cell: string;
  cep: string;
  district: string;
  city: string;
  state: string;
  street: string;
  number: string;
  complement: string;
  typeChip: "fisico" | "eSim";
  deliveryMethod: string;
  coupon: string;
  planId: string;
  planOperator: string;
}

const REFERRAL_CODE = "110956";
const SPONSOR_NAME = "Francisco Eliedisom Dos Santos";

const PLANS = {
  VIVO: [
    { id: "178", name: "40GB COM LIGAÇÃO", price: "49.90" },
    { id: "69", name: "80GB COM LIGAÇÃO", price: "69.90" },
    { id: "61", name: "150GB COM LIGAÇÃO", price: "99.90" },
  ],
  TIM: [
    { id: "56", name: "100GB COM LIGAÇÃO", price: "69.90" },
    { id: "154", name: "200GB SEM LIGAÇÃO", price: "159.90" },
    { id: "155", name: "300GB SEM LIGAÇÃO", price: "199.90" },
  ],
  CLARO: [
    { id: "57", name: "80GB COM LIGAÇÃO", price: "69.90" },
    { id: "183", name: "150GB COM LIGAÇÃO", price: "99.90" },
  ],
};

const STATES = [
  { value: "AC", label: "Acre" },
  { value: "AL", label: "Alagoas" },
  { value: "AP", label: "Amapá" },
  { value: "AM", label: "Amazonas" },
  { value: "BA", label: "Bahia" },
  { value: "CE", label: "Ceará" },
  { value: "DF", label: "Distrito Federal" },
  { value: "ES", label: "Espírito Santo" },
  { value: "GO", label: "Goiás" },
  { value: "MA", label: "Maranhão" },
  { value: "MT", label: "Mato Grosso" },
  { value: "MS", label: "Mato Grosso do Sul" },
  { value: "MG", label: "Minas Gerais" },
  { value: "PA", label: "Pará" },
  { value: "PB", label: "Paraíba" },
  { value: "PR", label: "Paraná" },
  { value: "PE", label: "Pernambuco" },
  { value: "PI", label: "Piauí" },
  { value: "RJ", label: "Rio de Janeiro" },
  { value: "RN", label: "Rio Grande do Norte" },
  { value: "RS", label: "Rio Grande do Sul" },
  { value: "RO", label: "Rondônia" },
  { value: "RR", label: "Roraima" },
  { value: "SC", label: "Santa Catarina" },
  { value: "SP", label: "São Paulo" },
  { value: "SE", label: "Sergipe" },
  { value: "TO", label: "Tocantins" },
];

export default function RegistrationForm() {
  const [step, setStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [whatsappUrl, setWhatsappUrl] = useState<string>("");
  const { toast } = useToast();
  const [formData, setFormData] = useState<FormData>({
    cpf: "",
    birth: "",
    name: "",
    email: "",
    phone: "",
    cell: "",
    cep: "",
    district: "",
    city: "",
    state: "",
    street: "",
    number: "",
    complement: "",
    typeChip: "fisico",
    deliveryMethod: "",
    coupon: "",
    planId: "",
    planOperator: "",
  });

  const totalSteps = 5;

  const operatorColors: Record<string, { bg: string; text: string; border: string }> = {
    VIVO: { bg: "bg-purple-600", text: "text-white", border: "border-purple-600" },
    TIM: { bg: "bg-blue-600", text: "text-white", border: "border-blue-600" },
    CLARO: { bg: "bg-red-600", text: "text-white", border: "border-red-600" },
  };

  const formatCPF = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})/, "$1-$2")
      .replace(/(-\d{2})\d+?$/, "$1");
  };

  const formatPhone = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2")
      .replace(/(-\d{4})\d+?$/, "$1");
  };

  const formatCellPhone = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2")
      .replace(/(-\d{4})\d+?$/, "$1");
  };

  const formatCEP = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{5})(\d)/, "$1-$2")
      .replace(/(-\d{3})\d+?$/, "$1");
  };

  const fetchAddressByCEP = async (cep: string) => {
    const cleanCEP = cep.replace(/\D/g, "");
    if (cleanCEP.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);
        const data = await response.json();
        if (!data.erro) {
          setFormData(prev => ({
            ...prev,
            street: data.logradouro || "",
            district: data.bairro || "",
            city: data.localidade || "",
            state: data.uf || "",
          }));
          toast({
            title: "Endereço encontrado!",
            description: "Os campos foram preenchidos automaticamente.",
          });
        }
      } catch (error) {
        console.error("Erro ao buscar CEP:", error);
      }
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    let formattedValue = value;

    if (field === "cpf") formattedValue = formatCPF(value);
    if (field === "phone") formattedValue = formatPhone(value);
    if (field === "cell") formattedValue = formatCellPhone(value);
    if (field === "cep") {
      formattedValue = formatCEP(value);
      if (formattedValue.replace(/\D/g, "").length === 8) {
        fetchAddressByCEP(formattedValue);
      }
    }

    setFormData(prev => ({ ...prev, [field]: formattedValue }));
  };

  const validateStep = () => {
    if (step === 1) {
      if (!formData.planId) {
        toast({
          variant: "destructive",
          title: "Selecione um plano",
          description: "Por favor, escolha um plano para continuar.",
        });
        return false;
      }
    }
    if (step === 2) {
      if (!formData.cpf || !formData.birth || !formData.name) {
        toast({
          variant: "destructive",
          title: "Campos obrigatórios",
          description: "Por favor, preencha todos os campos obrigatórios.",
        });
        return false;
      }
    }
    if (step === 3) {
      if (!formData.email || !formData.phone || !formData.cell) {
        toast({
          variant: "destructive",
          title: "Campos obrigatórios",
          description: "Por favor, preencha todos os campos de contato.",
        });
        return false;
      }
    }
    if (step === 4) {
      if (!formData.deliveryMethod) {
        toast({
          variant: "destructive",
          title: "Campo obrigatório",
          description: "Por favor, selecione a forma de envio.",
        });
        return false;
      }
    }
    if (step === 5) {
      if (!formData.cep || !formData.street || !formData.city || !formData.state) {
        toast({
          variant: "destructive",
          title: "Campos obrigatórios",
          description: "Por favor, preencha todos os campos de endereço.",
        });
        return false;
      }
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep()) {
      setStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const prevStep = () => {
    setStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Enviar dados para a API da Federal Associados através da edge function
      const { data, error } = await supabase.functions.invoke('submit-registration', {
        body: {
          cpf: formData.cpf,
          birth: formData.birth,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          cell: formData.cell,
          cep: formData.cep,
          district: formData.district,
          city: formData.city,
          state: formData.state,
          street: formData.street,
          number: formData.number,
          complement: formData.complement,
          typeChip: formData.typeChip,
          deliveryMethod: formData.deliveryMethod,
          coupon: formData.coupon,
          planId: formData.planId,
        }
      });

      if (error) {
        console.error('Error submitting registration:', error);
        toast({
          variant: "destructive",
          title: "Erro ao enviar cadastro",
          description: "Ocorreu um erro ao processar seu cadastro. Tente novamente.",
        });
        return;
      }

      if (!data?.success) {
        console.error('Registration failed:', data);
        toast({
          variant: "destructive",
          title: "Erro no cadastro",
          description: data?.error || "Não foi possível completar o cadastro.",
        });
        return;
      }

      // Sucesso!
      setIsSubmitted(true);
      if (data?.whatsappUrl) {
        setWhatsappUrl(data.whatsappUrl);
      }
      toast({
        title: "Cadastro realizado com sucesso!",
        description: "Seu cadastro foi enviado para a Federal Associados.",
      });
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        variant: "destructive",
        title: "Erro inesperado",
        description: "Ocorreu um erro ao processar seu cadastro. Tente novamente.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-primary">
        <Card className="w-full max-w-md p-8 text-center shadow-elevated animate-scale-in">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-gradient-success flex items-center justify-center shadow-glow">
              <CheckCircle2 className="w-12 h-12 text-success-foreground" />
            </div>
          </div>
          <h2 className="text-3xl font-bold mb-4">Cadastro Concluído!</h2>
          <p className="text-muted-foreground mb-6">
            Seu cadastro foi realizado com sucesso e enviado para a Federal Associados com o código de patrocinador <strong>110956</strong>.
          </p>
          <p className="text-sm text-muted-foreground mb-8">
            Suas comissões serão processadas automaticamente pela empresa.
          </p>
          <div className="space-y-3">
            {whatsappUrl && (
              <Button
                onClick={() => window.location.href = whatsappUrl}
                className="w-full bg-green-600 hover:bg-green-700 text-white transition-colors"
              >
                Continuar no WhatsApp
              </Button>
            )}
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              className="w-full"
            >
              Fazer novo cadastro
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-primary">
      <Card className="w-full max-w-4xl shadow-elevated animate-fade-in">
        {/* Header with Sponsor Info */}
        <div className="bg-gradient-accent p-6 rounded-t-lg">
          <div className="flex items-center justify-between text-accent-foreground">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2">Federal Associados</h1>
              <p className="text-sm md:text-base opacity-90">Cadastro de Novo Associado</p>
            </div>
            <Shield className="w-12 h-12 md:w-16 md:h-16 opacity-80" />
          </div>
          <div className="mt-4 bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
            <p className="text-xs md:text-sm opacity-90">Patrocinador</p>
            <p className="font-semibold text-sm md:text-base">{SPONSOR_NAME}</p>
            <p className="text-xs opacity-75">Código: {REFERRAL_CODE}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Step 1: Plan Selection */}
          {step === 1 && (
            <div className="space-y-6 animate-slide-in">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-5 h-5 text-primary" />
                <h3 className="text-xl font-semibold">Escolha seu Plano</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="typeChip">Tipo de Chip</Label>
                  <RadioGroup
                    value={formData.typeChip}
                    onValueChange={(value: "fisico" | "eSim") => setFormData(prev => ({ ...prev, typeChip: value }))}
                    className="flex gap-4 mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="fisico" id="fisico" />
                      <Label htmlFor="fisico" className="cursor-pointer">Chip Físico</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="eSim" id="eSim" />
                      <Label htmlFor="eSim" className="cursor-pointer">e-SIM</Label>
                    </div>
                  </RadioGroup>
                </div>


                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.entries(PLANS).map(([operator, plans]) => (
                    plans.map((plan) => {
                      const colors = operatorColors[operator] || operatorColors.VIVO;
                      return (
                        <Card
                          key={plan.id}
                          onClick={() => setFormData(prev => ({ ...prev, planId: plan.id, planOperator: operator }))}
                          className={cn(
                            "cursor-pointer transition-all hover:shadow-lg overflow-hidden",
                            formData.planId === plan.id
                              ? "ring-4 ring-offset-2 shadow-xl scale-105"
                              : "hover:scale-102",
                            `ring-${operator === 'VIVO' ? 'purple' : operator === 'TIM' ? 'blue' : 'red'}-600`
                          )}
                        >
                          <div className={cn("p-3 text-center", colors.bg, colors.text)}>
                            <div className="font-bold text-lg">{operator}</div>
                          </div>
                          <div className="p-4 text-center">
                            <div className="font-bold text-3xl mb-1">
                              {plan.name.split(" ")[0]}
                            </div>
                            <div className="text-xs text-muted-foreground mb-3">
                              {plan.name.replace(plan.name.split(" ")[0], "")}
                            </div>
                            <div className={cn("text-2xl font-bold", operator === 'VIVO' ? 'text-purple-600' : operator === 'TIM' ? 'text-blue-600' : 'text-red-600')}>
                              R$ {plan.price}
                              <span className="text-sm font-normal text-muted-foreground">/mês</span>
                            </div>
                          </div>
                        </Card>
                      );
                    })
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Personal Data */}
          {step === 2 && (
            <div className="space-y-4 animate-slide-in">
              <div className="flex items-center gap-2 mb-4">
                <User className="w-5 h-5 text-primary" />
                <h3 className="text-xl font-semibold">Dados Pessoais</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cpf">CPF *</Label>
                  <Input
                    id="cpf"
                    value={formData.cpf}
                    onChange={(e) => handleInputChange("cpf", e.target.value)}
                    placeholder="000.000.000-00"
                    maxLength={14}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="birth">Data de Nascimento *</Label>
                  <Input
                    id="birth"
                    type="date"
                    value={formData.birth}
                    onChange={(e) => handleInputChange("birth", e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="name">Nome Completo *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Digite seu nome completo"
                  required
                />
              </div>
            </div>
          )}

          {/* Step 3: Contact */}
          {step === 3 && (
            <div className="space-y-4 animate-slide-in">
              <div className="flex items-center gap-2 mb-4">
                <Smartphone className="w-5 h-5 text-primary" />
                <h3 className="text-xl font-semibold">Informações de Contato</h3>
              </div>
              
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="seu@email.com"
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Telefone *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="(00) 0000-0000"
                    maxLength={14}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="cell">Celular *</Label>
                  <Input
                    id="cell"
                    value={formData.cell}
                    onChange={(e) => handleInputChange("cell", e.target.value)}
                    placeholder="(00) 00000-0000"
                    maxLength={15}
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Delivery Method */}
          {step === 4 && (
            <div className="space-y-6 animate-slide-in">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-5 h-5 text-primary" />
                <h3 className="text-xl font-semibold">Forma de Envio</h3>
              </div>

              <RadioGroup
                value={formData.deliveryMethod}
                onValueChange={(value) => setFormData(prev => ({ ...prev, deliveryMethod: value }))}
                className="space-y-4"
              >
                <div className={cn(
                  "flex items-start space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all",
                  formData.deliveryMethod === "carta" ? "border-accent bg-accent/5" : "border-border hover:border-accent/50"
                )}>
                  <RadioGroupItem value="carta" id="carta" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="carta" className="cursor-pointer font-semibold text-base">
                      Enviar via Carta Registrada
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Para quem vai receber o chip pelos Correios
                    </p>
                  </div>
                </div>

                <div className={cn(
                  "flex items-start space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all",
                  formData.deliveryMethod === "associacao" || formData.deliveryMethod === "associado" ? "border-accent bg-accent/5" : "border-border hover:border-accent/50"
                )}>
                  <RadioGroupItem value="associacao" id="associacao" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="associacao" className="cursor-pointer font-semibold text-base">
                      Retirar na Associação ou com um Associado
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Se você vai retirar o chip pessoalmente com um representante ou no caso dos planos da Vivo, vai comprar um chip para ativar de forma imediata
                    </p>
                  </div>
                </div>
              </RadioGroup>
            </div>
          )}

          {/* Step 5: Address */}
          {step === 5 && (
            <div className="space-y-4 animate-slide-in">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-5 h-5 text-primary" />
                <h3 className="text-xl font-semibold">Endereço</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="cep">CEP *</Label>
                  <Input
                    id="cep"
                    value={formData.cep}
                    onChange={(e) => handleInputChange("cep", e.target.value)}
                    placeholder="00000-000"
                    maxLength={9}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="city">Cidade *</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                    placeholder="Cidade"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="state">Estado *</Label>
                  <Select value={formData.state} onValueChange={(value) => setFormData(prev => ({ ...prev, state: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATES.map((state) => (
                        <SelectItem key={state.value} value={state.value}>
                          {state.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="district">Bairro *</Label>
                <Input
                  id="district"
                  value={formData.district}
                  onChange={(e) => handleInputChange("district", e.target.value)}
                  placeholder="Bairro"
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="street">Endereço *</Label>
                  <Input
                    id="street"
                    value={formData.street}
                    onChange={(e) => handleInputChange("street", e.target.value)}
                    placeholder="Rua, Avenida..."
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="number">Número</Label>
                  <Input
                    id="number"
                    value={formData.number}
                    onChange={(e) => handleInputChange("number", e.target.value)}
                    placeholder="Nº"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="complement">Complemento</Label>
                <Input
                  id="complement"
                  value={formData.complement}
                  onChange={(e) => handleInputChange("complement", e.target.value)}
                  placeholder="Apto, Bloco, etc."
                />
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-4 pt-6 border-t">
            {step > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Voltar
              </Button>
            )}
            
            {step < totalSteps ? (
              <Button
                type="button"
                onClick={nextStep}
                className="ml-auto bg-gradient-primary hover:opacity-90 transition-opacity flex items-center gap-2"
              >
                Próximo
                <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={isSubmitting}
                className="ml-auto bg-gradient-success hover:opacity-90 transition-opacity shadow-glow disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  "Concluir Cadastro"
                )}
              </Button>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>2025 © Federal Associados (CNPJ 29.383.343/0001-64) - Todos os direitos reservados</p>
        </div>
      </Card>
    </div>
  );
}
