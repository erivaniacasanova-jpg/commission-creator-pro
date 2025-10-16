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
    console.log('Received registration data:', { ...formData, cpf: '***' });

    // Criar URLSearchParams com todos os dados do formulário
    const params = new URLSearchParams();
    
    // Campos hidden obrigatórios
    params.append('status', '0');
    params.append('father', '110956'); // Código do patrocinador
    params.append('type', 'Recorrente');
    
    // Dados pessoais
    params.append('cpf', formData.cpf || '');
    params.append('birth', formData.birth || '');
    params.append('name', formData.name || '');
    
    // Contato
    params.append('email', formData.email || '');
    params.append('phone', formData.phone || '');
    params.append('cell', formData.cell || '');
    
    // Endereço
    params.append('cep', formData.cep || '');
    params.append('district', formData.district || '');
    params.append('city', formData.city || '');
    params.append('state', formData.state || '');
    params.append('street', formData.street || '');
    params.append('number', formData.number || '');
    params.append('complement', formData.complement || '');
    
    // Plano e extras
    params.append('typeChip', formData.typeChip || 'fisico');
    params.append('coupon', formData.coupon || '');
    params.append('plan_id', formData.planId || '');
    params.append('deliveryMethod', formData.deliveryMethod || '');

    console.log('Sending data to Federal Associados API...');
    console.log('Form data being sent:', params.toString());

    // Enviar para a API oficial da Federal Associados
    const response = await fetch('https://federalassociados.com.br/registroSave', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const responseText = await response.text();
    console.log('API Response Status:', response.status);
    console.log('API Response (first 500 chars):', responseText.substring(0, 500));

    // Se a resposta contém HTML, provavelmente houve erro ou redirecionamento
    if (responseText.includes('<!DOCTYPE html>') || responseText.includes('<html')) {
      console.log('Received HTML response - checking for success indicators');
      
      // Verificar se há indicadores de sucesso no HTML
      if (responseText.includes('sucesso') || responseText.includes('registrado') || response.status === 200) {
        console.log('Registration appears successful based on response');
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Cadastro enviado com sucesso para a Federal Associados!',
            note: 'A comissão será processada automaticamente pela Federal Associados.'
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      } else {
        console.error('HTML response without success indicators');
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'A API retornou uma resposta inesperada. Por favor, verifique se o cadastro foi registrado no sistema da Federal Associados.'
          }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    }

    // Tentar parsear como JSON se não for HTML
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
