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

    // Primeiro, obter o token CSRF da página
    let csrfToken = '';
    try {
      const pageResponse = await fetch('https://federalassociados.com.br/registro/110956');
      const pageHtml = await pageResponse.text();
      const tokenMatch = pageHtml.match(/name="_token"\s+value="([^"]+)"/);
      if (tokenMatch) {
        csrfToken = tokenMatch[1];
        console.log('CSRF token obtained successfully');
      }
    } catch (error) {
      console.error('Failed to get CSRF token:', error);
    }

    // Criar URLSearchParams com todos os dados do formulário
    const params = new URLSearchParams();

    // Token CSRF
    if (csrfToken) {
      params.append('_token', csrfToken);
    }

    // Campos hidden obrigatórios
    params.append('status', '0');
    params.append('father', '110956'); // Código do patrocinador
    params.append('type', 'Recorrente');
    
    // Dados pessoais
    params.append('cpf', formData.cpf || '');
    // A data vem no formato YYYY-MM-DD, precisa enviar assim mesmo
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

    // Mapear deliveryMethod para typeFrete (formato esperado pela API da Federal Associados)
    const typeFreteMap: Record<string, string> = {
      'carta': 'Carta',
      'associacao': 'semFrete',
      'associado': 'semFrete',
    };
    const typeFrete = typeFreteMap[formData.deliveryMethod] || formData.deliveryMethod || '';
    params.append('typeFrete', typeFrete);

    console.log('Sending data to Federal Associados API...');
    console.log('Form data being sent:', params.toString());

    // Enviar para a API oficial da Federal Associados
    const response = await fetch('https://federalassociados.com.br/registroSave', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        'Referer': 'https://federalassociados.com.br/registro/110956',
        'Origin': 'https://federalassociados.com.br',
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

        // Criar mensagem para WhatsApp com os dados do cadastro
        const whatsappMessage = `🎉 *Novo Cadastro Federal Associados*\n\n` +
          `👤 *Nome:* ${formData.name}\n` +
          `📧 *Email:* ${formData.email}\n` +
          `📱 *Celular:* ${formData.cell}\n` +
          `📍 *Cidade:* ${formData.city} - ${formData.state}\n` +
          `📦 *Plano ID:* ${formData.planId}\n` +
          `🏷️ *Código Patrocinador:* 110956\n\n` +
          `✅ Cadastro realizado com sucesso!`;

        const whatsappUrl = `https://wa.me/558006262345?text=${encodeURIComponent(whatsappMessage)}`;

        return new Response(
          JSON.stringify({
            success: true,
            message: 'Cadastro enviado com sucesso para a Federal Associados!',
            note: 'A comissão será processada automaticamente pela Federal Associados.',
            whatsappUrl: whatsappUrl
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

    // Criar mensagem para WhatsApp com os dados do cadastro
    const whatsappMessage = `🎉 *Novo Cadastro Federal Associados*\n\n` +
      `👤 *Nome:* ${formData.name}\n` +
      `📧 *Email:* ${formData.email}\n` +
      `📱 *Celular:* ${formData.cell}\n` +
      `📍 *Cidade:* ${formData.city} - ${formData.state}\n` +
      `📦 *Plano ID:* ${formData.planId}\n` +
      `🏷️ *Código Patrocinador:* 110956\n\n` +
      `✅ Cadastro realizado com sucesso!`;

    const whatsappUrl = `https://wa.me/558006262345?text=${encodeURIComponent(whatsappMessage)}`;

    return new Response(
      JSON.stringify({
        success: true,
        data: responseData,
        message: 'Cadastro enviado com sucesso para a Federal Associados!',
        whatsappUrl: whatsappUrl
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