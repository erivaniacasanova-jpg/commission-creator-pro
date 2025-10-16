const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.json();
    console.log('Received registration data');

    const params = new URLSearchParams();

    params.append('_token', 'oCqwAglu4VySDRcwWNqj81UMfbKHCS2vWQfARkzu');
    params.append('status', '0');
    params.append('father', '110956');
    params.append('type', 'Recorrente');
    params.append('cpf', formData.cpf || '');
    params.append('birth', formData.birth || '');
    params.append('name', formData.name || '');
    params.append('email', formData.email || '');
    params.append('phone', formData.phone || '');
    params.append('cell', formData.cell || '');
    params.append('cep', formData.cep || '');
    params.append('district', formData.district || '');
    params.append('city', formData.city || '');
    params.append('state', formData.state || '');
    params.append('street', formData.street || '');
    params.append('number', formData.number || '');
    params.append('complement', formData.complement || '');
    params.append('typeChip', formData.typeChip || 'fisico');
    params.append('coupon', formData.coupon || '');
    params.append('plan_id', formData.planId || '');

    const typeFreteMap: Record<string, string> = {
      'carta': 'Carta',
      'associacao': 'semFrete',
      'associado': 'semFrete',
    };
    params.append('typeFrete', typeFreteMap[formData.deliveryMethod] || 'Carta');

    console.log('Sending to Federal Associados API...');

    const response = await fetch('https://federalassociados.com.br/registroSave', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
      redirect: 'manual'
    });

    console.log('Response status:', response.status);

    if (response.status === 301 || response.status === 302) {
      const redirectUrl = response.headers.get('location');
      console.log('Redirect URL:', redirectUrl);

      if (redirectUrl) {
        const billingIdMatch = redirectUrl.match(/billing[_-]?id[=\/](\d+)/i);
        const urlIdMatch = redirectUrl.match(/\/(\d+)$/);
        const billing_id = billingIdMatch ? billingIdMatch[1] : (urlIdMatch ? urlIdMatch[1] : null);

        console.log('Extracted billing_id:', billing_id);

        if (billing_id) {
          const whatsappMessage = `🎉 *Novo Cadastro Federal Associados*\n\n` +
            `👤 *Nome:* ${formData.name}\n` +
            `📧 *Email:* ${formData.email}\n` +
            `📱 *Celular:* ${formData.cell}\n` +
            `📍 *Cidade:* ${formData.city} - ${formData.state}\n` +
            `📦 *Plano ID:* ${formData.planId}\n` +
            `🆔 *Billing ID:* ${billing_id}\n` +
            `🏷️ *Patrocinador:* 110956\n\n` +
            `✅ Cadastro realizado com sucesso!`;

          const whatsappUrl = `https://wa.me/558006262345?text=${encodeURIComponent(whatsappMessage)}`;

          return new Response(
            JSON.stringify({
              success: true,
              billing_id: billing_id,
              message: 'Cadastro enviado com sucesso!',
              whatsappUrl: whatsappUrl,
              redirectUrl: redirectUrl
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    const responseText = await response.text();
    console.log('Response text (first 500):', responseText.substring(0, 500));

    if (responseText.includes('sucesso') || responseText.includes('cadastro') || response.status === 200) {
      const whatsappMessage = `🎉 *Novo Cadastro Federal Associados*\n\n` +
        `👤 *Nome:* ${formData.name}\n` +
        `📧 *Email:* ${formData.email}\n` +
        `📱 *Celular:* ${formData.cell}\n` +
        `📍 *Cidade:* ${formData.city} - ${formData.state}\n` +
        `📦 *Plano ID:* ${formData.planId}\n` +
        `🏷️ *Patrocinador:* 110956\n\n` +
        `✅ Cadastro realizado com sucesso!`;

      const whatsappUrl = `https://wa.me/558006262345?text=${encodeURIComponent(whatsappMessage)}`;

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Cadastro enviado com sucesso!',
          whatsappUrl: whatsappUrl
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Erro ao processar cadastro. Verifique os dados e tente novamente.'
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error:', error);
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