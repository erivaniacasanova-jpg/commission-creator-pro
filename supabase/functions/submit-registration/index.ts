const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.json();
    console.log('Received registration data:', { ...formData, cpf: '***' }); // Log sem CPF completo

    // Criar FormData para enviar para a API da Federal Associados
    const apiFormData = new FormData();
    
    // Campos hidden obrigatórios
    apiFormData.append('status', '0');
    apiFormData.append('father', '110956'); // Código do patrocinador
    apiFormData.append('type', 'Recorrente');
    
    // Dados pessoais
    apiFormData.append('cpf', formData.cpf || '');
    apiFormData.append('birth', formData.birth || '');
    apiFormData.append('name', formData.name || '');
    
    // Contato
    apiFormData.append('email', formData.email || '');
    apiFormData.append('phone', formData.phone || '');
    apiFormData.append('cell', formData.cell || '');
    
    // Endereço
    apiFormData.append('cep', formData.cep || '');
    apiFormData.append('district', formData.district || '');
    apiFormData.append('city', formData.city || '');
    apiFormData.append('state', formData.state || '');
    apiFormData.append('street', formData.street || '');
    apiFormData.append('number', formData.number || '');
    apiFormData.append('complement', formData.complement || '');
    
    // Plano e extras
    apiFormData.append('typeChip', formData.typeChip || 'fisico');
    apiFormData.append('coupon', formData.coupon || '');
    apiFormData.append('plan_id', formData.planId || '');

    console.log('Sending data to Federal Associados API...');

    // Enviar para a API oficial da Federal Associados
    const response = await fetch('https://federalassociados.com.br/registroSave', {
      method: 'POST',
      body: apiFormData,
      // Não incluímos Content-Type, o navegador define automaticamente para multipart/form-data
    });

    const responseText = await response.text();
    console.log('API Response Status:', response.status);
    console.log('API Response:', responseText);

    if (!response.ok) {
      console.error('API Error:', responseText);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Erro ao enviar cadastro para a Federal Associados',
          details: responseText 
        }),
        { 
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Tentar parsear a resposta como JSON, se falhar retorna o texto
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { message: responseText };
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: responseData,
        message: 'Cadastro enviado com sucesso para a Federal Associados!'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in submit-registration:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
