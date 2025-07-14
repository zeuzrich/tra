import OpenAI from 'openai';
import { Test } from '../types';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

export const generateTrafficInsight = async (test: Test): Promise<string> => {
  if (!import.meta.env.VITE_OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  const prompt = `
Você é um especialista em tráfego direto para infoprodutos black (nichos como MMO, trading, apostas, relacionamentos, etc.).

Analise os dados desta campanha e forneça insights específicos para otimização:

DADOS DA CAMPANHA:
- Produto: ${test.productName}
- Nicho: ${test.niche}
- Investimento: R$ ${test.investedAmount.toFixed(2)}
- Impressões: ${test.impressions}
- Cliques: ${test.clicks}
- Conversões: ${test.conversions}
- Retorno: R$ ${test.returnValue.toFixed(2)}
- CTR: ${test.ctr.toFixed(2)}%
- Taxa de Conversão: ${test.conversionRate.toFixed(2)}%
- CPC: R$ ${test.cpc.toFixed(2)}
- ROI: ${test.roi.toFixed(2)}%
- ROAS: ${test.roas.toFixed(2)}%
- Status: ${test.status}

CONTEXTO: Esta é uma campanha de tráfego direto focada em infoprodutos black. O público é mais agressivo e responde a gatilhos de urgência, escassez e autoridade.

Forneça:
1. Análise das métricas principais
2. Pontos de otimização específicos para tráfego black
3. Recomendações de ação baseadas no status atual
4. Sugestões de criativos/copy para este nicho
5. Estratégias de escala ou correção

Seja direto, prático e focado em resultados financeiros.
`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "Você é um especialista em tráfego direto para infoprodutos black com foco em maximizar ROI e ROAS."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 1000,
      temperature: 0.7
    });

    return completion.choices[0]?.message?.content || 'Não foi possível gerar insight.';
  } catch (error) {
    console.error('Error generating OpenAI insight:', error);
    throw new Error('Erro ao gerar insight com IA');
  }
};