import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const freePolicy = await prisma.rateLimitPolicy.upsert({
    where: { name: 'free_default' },
    update: {},
    create: {
      name: 'free_default',
      rpmLimit: 20,
      tpmLimit: 20_000,
      dailyRequestLimit: 1_000,
      dailyTokenLimit: 100_000,
      description: 'Default free-tier rate limit policy.',
    },
  });

  const openAi = await prisma.provider.upsert({
    where: { name: 'openai' },
    update: {},
    create: {
      name: 'openai',
      displayName: 'OpenAI',
      type: 'OPENAI',
      baseUrl: 'https://api.openai.com/v1',
      priority: 10,
      credentials: { create: { name: 'default', keyRef: 'OPENAI_API_KEY' } },
    },
  });

  const gpt4oMini = await prisma.model.upsert({
    where: { name: 'gpt-4o-mini' },
    update: {},
    create: {
      name: 'gpt-4o-mini',
      displayName: 'GPT-4o mini',
      modality: 'CHAT',
      contextWindow: 128_000,
      inputPricePer1MTokensMicro: 150n,
      outputPricePer1MTokensMicro: 600n,
    },
  });

  await prisma.modelProviderMapping.upsert({
    where: {
      modelId_providerId_providerModel: {
        modelId: gpt4oMini.id,
        providerId: openAi.id,
        providerModel: 'gpt-4o-mini',
      },
    },
    update: {},
    create: {
      modelId: gpt4oMini.id,
      providerId: openAi.id,
      providerModel: 'gpt-4o-mini',
      isPrimary: true,
      priority: 10,
      timeoutMs: 60_000,
      maxRetries: 1,
    },
  });

  console.log(`Seeded policy ${freePolicy.name} and model ${gpt4oMini.name}.`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
