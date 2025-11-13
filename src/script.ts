/* eslint-disable @typescript-eslint/no-unsafe-assignment,
  @typescript-eslint/no-unsafe-call,
  @typescript-eslint/no-unsafe-member-access */
import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

type ExerciseInput = {
  name: string;
  description?: string;
  isUnilateral?: boolean;
  primaryMuscle: string;
  equipments?: string[];
};

async function upsertMuscleGroups(names: string[]) {
  const created: Record<string, { id: string; name: string }> = {};

  for (const name of names) {
    const mg = await prisma.muscleGroup.upsert({
      where: { name },
      create: { name },
      update: {},
    });
    created[name] = mg;
  }

  return created;
}

async function upsertExercise(
  ex: ExerciseInput,
  muscleMap: Record<string, any>,
) {
  const exercise = await prisma.exerciseDefinition.upsert({
    where: { name: ex.name },
    create: {
      name: ex.name,
      description: ex.description ?? undefined,
      isUnilateral: ex.isUnilateral ?? false,
    },
    update: {
      description: ex.description ?? undefined,
      isUnilateral: ex.isUnilateral ?? false,
    },
  });

  // Link the single primary muscle
  const m = ex.primaryMuscle;
  const mg = muscleMap[m];
  if (mg) {
    const exists = await prisma.exerciseDefinitionOnMuscleGroup.findUnique({
      where: {
        exerciseDefinitionId_muscleGroupId: {
          exerciseDefinitionId: exercise.id,
          muscleGroupId: mg.id,
        },
      },
    });

    if (!exists) {
      await prisma.exerciseDefinitionOnMuscleGroup.create({
        data: {
          exerciseDefinitionId: exercise.id,
          muscleGroupId: mg.id,
          isPrimary: true,
        },
      });
    }
  }
}

async function main() {
  console.log('Seeding exercise definitions...');

  const muscleGroups = [
    'Peito',
    'Costas',
    'Ombros',
    'Quadríceps',
    'Bíceps',
    'Tríceps',
    'Posterior de Coxa',
    'Panturrilha',
    'Abdômen',
    'Glúteos',
    'Trapézio',
    'Antebraço',
  ];

  const muscleMap = await upsertMuscleGroups(muscleGroups);

  const exercises: ExerciseInput[] = [
    // PEITO
    { name: 'Supino inclinado com halteres', primaryMuscle: 'Peito' },
    { name: 'Supino inclinado com barra', primaryMuscle: 'Peito' },
    { name: 'Supino inclinado máquina', primaryMuscle: 'Peito' },
    { name: 'Supino reto com barra', primaryMuscle: 'Peito' },
    { name: 'Supino reto com halteres', primaryMuscle: 'Peito' },
    { name: 'Supino reto máquina', primaryMuscle: 'Peito' },
    { name: 'Supino declinado com barra', primaryMuscle: 'Peito' },
    { name: 'Supino declinado com halteres', primaryMuscle: 'Peito' },
    { name: 'Supino declinado máquina', primaryMuscle: 'Peito' },
    { name: 'Crucifixo inclinado com halteres', primaryMuscle: 'Peito' },
    { name: 'Crucifixo inclinado no cabo', primaryMuscle: 'Peito' },
    { name: 'Crucifixo reto com halteres', primaryMuscle: 'Peito' },
    { name: 'Crucifixo reto no cabo', primaryMuscle: 'Peito' },
    { name: 'Crucifixo declinado com halteres', primaryMuscle: 'Peito' },
    { name: 'Crossover', primaryMuscle: 'Peito' },
    { name: 'Crossover alto', primaryMuscle: 'Peito' },
    { name: 'Crossover baixo', primaryMuscle: 'Peito' },
    {
      name: 'Crossover unilateral',
      primaryMuscle: 'Peito',
      isUnilateral: true,
    },
    { name: 'Push-up', primaryMuscle: 'Peito' },
    { name: 'Peck deck', primaryMuscle: 'Peito' },
    { name: 'Flexão de braço', primaryMuscle: 'Peito' },
    { name: 'Flexão de braço inclinada', primaryMuscle: 'Peito' },
    { name: 'Flexão de braço declinada', primaryMuscle: 'Peito' },
    { name: 'Flexão de braço diamante', primaryMuscle: 'Peito' },
    { name: 'Supino com pegada fechada', primaryMuscle: 'Peito' },
    { name: 'Pullover com halteres', primaryMuscle: 'Peito' },
    { name: 'Pullover com barra', primaryMuscle: 'Peito' },
    { name: 'Pullover na máquina', primaryMuscle: 'Peito' },
    { name: 'Supino no Smith', primaryMuscle: 'Peito' },
    { name: 'Supino inclinado no Smith', primaryMuscle: 'Peito' },

    // COSTAS
    { name: 'Barra fixa', primaryMuscle: 'Costas' },
    { name: 'Barra fixa pegada aberta', primaryMuscle: 'Costas' },
    { name: 'Barra fixa pegada fechada', primaryMuscle: 'Costas' },
    { name: 'Barra fixa supinada', primaryMuscle: 'Costas' },
    { name: 'Barra fixa pronada', primaryMuscle: 'Costas' },
    { name: 'Barra fixa neutra', primaryMuscle: 'Costas' },
    { name: 'Puxada frontal', primaryMuscle: 'Costas' },
    { name: 'Puxada aberta', primaryMuscle: 'Costas' },
    { name: 'Puxada fechada', primaryMuscle: 'Costas' },
    { name: 'Puxada com triângulo', primaryMuscle: 'Costas' },
    { name: 'Puxada supinada', primaryMuscle: 'Costas' },
    { name: 'Puxada pronada', primaryMuscle: 'Costas' },
    { name: 'Puxada atrás da nuca', primaryMuscle: 'Costas' },
    { name: 'Puxada unilateral', primaryMuscle: 'Costas', isUnilateral: true },
    { name: 'Remada curvada com barra', primaryMuscle: 'Costas' },
    { name: 'Remada curvada com halteres', primaryMuscle: 'Costas' },
    { name: 'Remada curvada pronada', primaryMuscle: 'Costas' },
    { name: 'Remada curvada supinada', primaryMuscle: 'Costas' },
    { name: 'Remada cavalinho', primaryMuscle: 'Costas' },
    { name: 'Remada sentada', primaryMuscle: 'Costas' },
    { name: 'Remada sentada pegada fechada', primaryMuscle: 'Costas' },
    { name: 'Remada sentada pegada aberta', primaryMuscle: 'Costas' },
    { name: 'Remada baixa', primaryMuscle: 'Costas' },
    { name: 'Remada baixa com triângulo', primaryMuscle: 'Costas' },
    { name: 'Remada baixa pegada aberta', primaryMuscle: 'Costas' },
    {
      name: 'Remada unilateral com halteres',
      primaryMuscle: 'Costas',
      isUnilateral: true,
    },
    {
      name: 'Remada unilateral no cabo',
      primaryMuscle: 'Costas',
      isUnilateral: true,
    },
    {
      name: 'Remada com halteres',
      primaryMuscle: 'Costas',
      isUnilateral: true,
    },
    { name: 'Remada serrote', primaryMuscle: 'Costas', isUnilateral: true },
    { name: 'Levantamento terra', primaryMuscle: 'Costas' },
    { name: 'Levantamento terra sumô', primaryMuscle: 'Costas' },
    { name: 'Levantamento terra romeno', primaryMuscle: 'Costas' },
    { name: 'Levantamento terra com barra', primaryMuscle: 'Costas' },
    { name: 'Levantamento terra com halteres', primaryMuscle: 'Costas' },
    { name: 'Remada máquina', primaryMuscle: 'Costas' },
    { name: 'Remada articulada', primaryMuscle: 'Costas' },
    { name: 'Pulldown', primaryMuscle: 'Costas' },
    { name: 'Remada T com barra', primaryMuscle: 'Costas' },
    { name: 'Remada T com pegada neutra', primaryMuscle: 'Costas' },
    { name: 'Remada Pendlay', primaryMuscle: 'Costas' },

    // OMBROS
    { name: 'Desenvolvimento com barra', primaryMuscle: 'Ombros' },
    { name: 'Desenvolvimento com halteres sentado', primaryMuscle: 'Ombros' },
    { name: 'Desenvolvimento com halteres em pé', primaryMuscle: 'Ombros' },
    { name: 'Desenvolvimento militar com barra', primaryMuscle: 'Ombros' },
    { name: 'Desenvolvimento militar com halteres', primaryMuscle: 'Ombros' },
    { name: 'Desenvolvimento Arnold', primaryMuscle: 'Ombros' },
    { name: 'Desenvolvimento na máquina', primaryMuscle: 'Ombros' },
    { name: 'Desenvolvimento no Smith', primaryMuscle: 'Ombros' },
    { name: 'Elevação lateral com halteres', primaryMuscle: 'Ombros' },
    { name: 'Elevação lateral com cabos', primaryMuscle: 'Ombros' },
    { name: 'Elevação lateral na máquina', primaryMuscle: 'Ombros' },
    { name: 'Elevação lateral inclinado', primaryMuscle: 'Ombros' },
    {
      name: 'Elevação lateral unilateral',
      primaryMuscle: 'Ombros',
      isUnilateral: true,
    },
    { name: 'Elevação frontal com halteres', primaryMuscle: 'Ombros' },
    { name: 'Elevação frontal com barra', primaryMuscle: 'Ombros' },
    { name: 'Elevação frontal com disco', primaryMuscle: 'Ombros' },
    { name: 'Elevação frontal com cabo', primaryMuscle: 'Ombros' },
    {
      name: 'Elevação frontal alternada',
      primaryMuscle: 'Ombros',
      isUnilateral: true,
    },
    { name: 'Crucifixo inverso com halteres', primaryMuscle: 'Ombros' },
    { name: 'Crucifixo inverso no cabo', primaryMuscle: 'Ombros' },
    { name: 'Crucifixo inverso na máquina', primaryMuscle: 'Ombros' },
    { name: 'Crucifixo inverso inclinado', primaryMuscle: 'Ombros' },
    { name: 'Remada alta com barra', primaryMuscle: 'Ombros' },
    { name: 'Remada alta com halteres', primaryMuscle: 'Ombros' },
    { name: 'Remada alta com cabo', primaryMuscle: 'Ombros' },
    { name: 'Face pull', primaryMuscle: 'Ombros' },
    { name: 'Elevação posterior com halteres', primaryMuscle: 'Ombros' },
    { name: 'Elevação posterior no cabo', primaryMuscle: 'Ombros' },
    { name: 'Elevação posterior máquina', primaryMuscle: 'Ombros' },

    // BÍCEPS
    { name: 'Rosca direta com barra', primaryMuscle: 'Bíceps' },
    { name: 'Rosca direta com halteres', primaryMuscle: 'Bíceps' },
    { name: 'Rosca direta com barra W', primaryMuscle: 'Bíceps' },
    { name: 'Rosca direta no cabo', primaryMuscle: 'Bíceps' },
    { name: 'Rosca direta na máquina', primaryMuscle: 'Bíceps' },
    { name: 'Rosca alternada', primaryMuscle: 'Bíceps', isUnilateral: true },
    {
      name: 'Rosca alternada em pé',
      primaryMuscle: 'Bíceps',
      isUnilateral: true,
    },
    {
      name: 'Rosca alternada sentado',
      primaryMuscle: 'Bíceps',
      isUnilateral: true,
    },
    { name: 'Rosca martelo com halteres', primaryMuscle: 'Bíceps' },
    { name: 'Rosca martelo no cabo', primaryMuscle: 'Bíceps' },
    {
      name: 'Rosca martelo alternada',
      primaryMuscle: 'Bíceps',
      isUnilateral: true,
    },
    { name: 'Rosca concentrada', primaryMuscle: 'Bíceps', isUnilateral: true },
    { name: 'Rosca Scott com barra', primaryMuscle: 'Bíceps' },
    { name: 'Rosca Scott com halteres', primaryMuscle: 'Bíceps' },
    { name: 'Rosca Scott com barra W', primaryMuscle: 'Bíceps' },
    { name: 'Rosca Scott no cabo', primaryMuscle: 'Bíceps' },
    {
      name: 'Rosca Scott unilateral',
      primaryMuscle: 'Bíceps',
      isUnilateral: true,
    },
    { name: 'Rosca inversa com barra', primaryMuscle: 'Bíceps' },
    { name: 'Rosca inversa com halteres', primaryMuscle: 'Bíceps' },
    { name: 'Rosca inversa no cabo', primaryMuscle: 'Bíceps' },
    { name: 'Rosca na polia baixa', primaryMuscle: 'Bíceps' },
    { name: 'Rosca na polia alta', primaryMuscle: 'Bíceps' },
    { name: 'Rosca 21', primaryMuscle: 'Bíceps' },
    { name: 'Rosca inclinada com halteres', primaryMuscle: 'Bíceps' },
    {
      name: 'Rosca inclinada alternada',
      primaryMuscle: 'Bíceps',
      isUnilateral: true,
    },
    { name: 'Rosca Spider com barra', primaryMuscle: 'Bíceps' },
    { name: 'Rosca Spider com halteres', primaryMuscle: 'Bíceps' },
    { name: 'Rosca na máquina', primaryMuscle: 'Bíceps' },

    // TRÍCEPS
    { name: 'Tríceps testa com barra', primaryMuscle: 'Tríceps' },
    { name: 'Tríceps testa com halteres', primaryMuscle: 'Tríceps' },
    { name: 'Tríceps testa com barra W', primaryMuscle: 'Tríceps' },
    { name: 'Tríceps testa no cabo', primaryMuscle: 'Tríceps' },
    {
      name: 'Tríceps testa unilateral',
      primaryMuscle: 'Tríceps',
      isUnilateral: true,
    },
    { name: 'Tríceps pulley com corda', primaryMuscle: 'Tríceps' },
    { name: 'Tríceps pulley com barra reta', primaryMuscle: 'Tríceps' },
    { name: 'Tríceps pulley com barra V', primaryMuscle: 'Tríceps' },
    { name: 'Tríceps pulley pegada invertida', primaryMuscle: 'Tríceps' },
    {
      name: 'Tríceps pulley unilateral',
      primaryMuscle: 'Tríceps',
      isUnilateral: true,
    },
    { name: 'Tríceps francês com barra', primaryMuscle: 'Tríceps' },
    { name: 'Tríceps francês com halteres', primaryMuscle: 'Tríceps' },
    {
      name: 'Tríceps francês unilateral',
      primaryMuscle: 'Tríceps',
      isUnilateral: true,
    },
    { name: 'Tríceps francês no cabo', primaryMuscle: 'Tríceps' },
    {
      name: 'Tríceps coice com halteres',
      primaryMuscle: 'Tríceps',
      isUnilateral: true,
    },
    {
      name: 'Tríceps coice no cabo',
      primaryMuscle: 'Tríceps',
      isUnilateral: true,
    },
    { name: 'Tríceps coice bilateral', primaryMuscle: 'Tríceps' },
    { name: 'Mergulho entre bancos', primaryMuscle: 'Tríceps' },
    { name: 'Mergulho no banco', primaryMuscle: 'Tríceps' },
    { name: 'Mergulho na paralela', primaryMuscle: 'Tríceps' },
    { name: 'Supino fechado com barra', primaryMuscle: 'Tríceps' },
    { name: 'Supino fechado com halteres', primaryMuscle: 'Tríceps' },
    { name: 'Supino fechado no Smith', primaryMuscle: 'Tríceps' },
    { name: 'Tríceps na máquina', primaryMuscle: 'Tríceps' },
    { name: 'Tríceps cross no cabo', primaryMuscle: 'Tríceps' },
    {
      name: 'Tríceps cross unilateral',
      primaryMuscle: 'Tríceps',
      isUnilateral: true,
    },
    { name: 'Tríceps over head no cabo', primaryMuscle: 'Tríceps' },
    { name: 'Tríceps polia alta', primaryMuscle: 'Tríceps' },
    { name: 'Tríceps polia baixa', primaryMuscle: 'Tríceps' },

    // QUADRÍCEPS
    { name: 'Agachamento livre com barra', primaryMuscle: 'Quadríceps' },
    { name: 'Agachamento livre com halteres', primaryMuscle: 'Quadríceps' },
    { name: 'Agachamento frontal com barra', primaryMuscle: 'Quadríceps' },
    { name: 'Agachamento frontal no Smith', primaryMuscle: 'Quadríceps' },
    { name: 'Agachamento sumô com halteres', primaryMuscle: 'Quadríceps' },
    { name: 'Agachamento sumô com barra', primaryMuscle: 'Quadríceps' },
    { name: 'Agachamento no Smith', primaryMuscle: 'Quadríceps' },
    { name: 'Agachamento hack', primaryMuscle: 'Quadríceps' },
    { name: 'Agachamento sissy', primaryMuscle: 'Quadríceps' },
    {
      name: 'Agachamento búlgaro com halteres',
      primaryMuscle: 'Quadríceps',
      isUnilateral: true,
    },
    {
      name: 'Agachamento búlgaro com barra',
      primaryMuscle: 'Quadríceps',
      isUnilateral: true,
    },
    { name: 'Leg press 45°', primaryMuscle: 'Quadríceps' },
    { name: 'Leg press horizontal', primaryMuscle: 'Quadríceps' },
    {
      name: 'Leg press 45° unilateral',
      primaryMuscle: 'Quadríceps',
      isUnilateral: true,
    },
    { name: 'Extensora bilateral', primaryMuscle: 'Quadríceps' },
    {
      name: 'Extensora unilateral',
      primaryMuscle: 'Quadríceps',
      isUnilateral: true,
    },
    {
      name: 'Afundo com halteres',
      primaryMuscle: 'Quadríceps',
      isUnilateral: true,
    },
    {
      name: 'Afundo com barra',
      primaryMuscle: 'Quadríceps',
      isUnilateral: true,
    },
    {
      name: 'Afundo no Smith',
      primaryMuscle: 'Quadríceps',
      isUnilateral: true,
    },
    {
      name: 'Afundo caminhando',
      primaryMuscle: 'Quadríceps',
      isUnilateral: true,
    },
    {
      name: 'Afundo reverso',
      primaryMuscle: 'Quadríceps',
      isUnilateral: true,
    },
    {
      name: 'Afundo lateral',
      primaryMuscle: 'Quadríceps',
      isUnilateral: true,
    },
    {
      name: 'Afundo estático',
      primaryMuscle: 'Quadríceps',
      isUnilateral: true,
    },
    { name: 'Passada com halteres', primaryMuscle: 'Quadríceps' },
    { name: 'Passada com barra', primaryMuscle: 'Quadríceps' },

    // POSTERIOR DE COXA
    { name: 'Flexora deitado', primaryMuscle: 'Posterior de Coxa' },
    {
      name: 'Flexora deitado unilateral',
      primaryMuscle: 'Posterior de Coxa',
      isUnilateral: true,
    },
    { name: 'Flexora sentado', primaryMuscle: 'Posterior de Coxa' },
    {
      name: 'Flexora sentado unilateral',
      primaryMuscle: 'Posterior de Coxa',
      isUnilateral: true,
    },
    {
      name: 'Flexora em pé',
      primaryMuscle: 'Posterior de Coxa',
      isUnilateral: true,
    },
    { name: 'Mesa flexora', primaryMuscle: 'Posterior de Coxa' },
    { name: 'Stiff com barra', primaryMuscle: 'Posterior de Coxa' },
    { name: 'Stiff com halteres', primaryMuscle: 'Posterior de Coxa' },
    {
      name: 'Stiff unilateral',
      primaryMuscle: 'Posterior de Coxa',
      isUnilateral: true,
    },
    {
      name: 'Levantamento terra com barra',
      primaryMuscle: 'Posterior de Coxa',
    },
    {
      name: 'Levantamento terra com halteres',
      primaryMuscle: 'Posterior de Coxa',
    },
    { name: 'Levantamento terra romeno', primaryMuscle: 'Posterior de Coxa' },
    { name: 'Good morning com barra', primaryMuscle: 'Posterior de Coxa' },
    { name: 'Good morning no Smith', primaryMuscle: 'Posterior de Coxa' },
    { name: 'Cadeira flexora', primaryMuscle: 'Posterior de Coxa' },
    {
      name: 'Flexora no cabo',
      primaryMuscle: 'Posterior de Coxa',
      isUnilateral: true,
    },

    // GLÚTEOS
    { name: 'Elevação pélvica com barra', primaryMuscle: 'Glúteos' },
    { name: 'Elevação pélvica com halteres', primaryMuscle: 'Glúteos' },
    {
      name: 'Elevação pélvica unilateral',
      primaryMuscle: 'Glúteos',
      isUnilateral: true,
    },
    { name: 'Hip thrust com barra', primaryMuscle: 'Glúteos' },
    { name: 'Hip thrust com halteres', primaryMuscle: 'Glúteos' },
    {
      name: 'Hip thrust unilateral',
      primaryMuscle: 'Glúteos',
      isUnilateral: true,
    },
    { name: 'Glúteo na máquina', primaryMuscle: 'Glúteos' },
    { name: 'Glúteo no cabo', primaryMuscle: 'Glúteos', isUnilateral: true },
    { name: 'Coice na máquina', primaryMuscle: 'Glúteos', isUnilateral: true },
    { name: 'Coice na polia', primaryMuscle: 'Glúteos', isUnilateral: true },
    {
      name: 'Coice com caneleira',
      primaryMuscle: 'Glúteos',
      isUnilateral: true,
    },
    { name: 'Abdução de quadril na máquina', primaryMuscle: 'Glúteos' },
    {
      name: 'Abdução de quadril no cabo',
      primaryMuscle: 'Glúteos',
      isUnilateral: true,
    },
    { name: 'Abdutora', primaryMuscle: 'Glúteos' },
    { name: 'Cadeira abdutora', primaryMuscle: 'Glúteos' },
    { name: 'Agachamento sumô com halteres', primaryMuscle: 'Glúteos' },
    { name: 'Agachamento sumô com barra', primaryMuscle: 'Glúteos' },
    { name: 'Stiff com barra', primaryMuscle: 'Glúteos' },
    { name: 'Stiff com halteres', primaryMuscle: 'Glúteos' },

    // PANTURRILHA
    { name: 'Panturrilha em pé na máquina', primaryMuscle: 'Panturrilha' },
    { name: 'Panturrilha em pé com barra', primaryMuscle: 'Panturrilha' },
    { name: 'Panturrilha em pé no Smith', primaryMuscle: 'Panturrilha' },
    { name: 'Panturrilha sentado na máquina', primaryMuscle: 'Panturrilha' },
    { name: 'Panturrilha sentado com halteres', primaryMuscle: 'Panturrilha' },
    { name: 'Panturrilha no leg press 45°', primaryMuscle: 'Panturrilha' },
    {
      name: 'Panturrilha no leg press horizontal',
      primaryMuscle: 'Panturrilha',
    },
    {
      name: 'Panturrilha unilateral em pé',
      primaryMuscle: 'Panturrilha',
      isUnilateral: true,
    },
    {
      name: 'Panturrilha unilateral no leg press',
      primaryMuscle: 'Panturrilha',
      isUnilateral: true,
    },
    { name: 'Panturrilha livre', primaryMuscle: 'Panturrilha' },
    { name: 'Panturrilha no hack', primaryMuscle: 'Panturrilha' },

    // ABDÔMEN
    { name: 'Abdominal supra', primaryMuscle: 'Abdômen' },
    { name: 'Abdominal supra no solo', primaryMuscle: 'Abdômen' },
    { name: 'Abdominal supra no banco declinado', primaryMuscle: 'Abdômen' },
    { name: 'Abdominal infra', primaryMuscle: 'Abdômen' },
    { name: 'Abdominal infra no solo', primaryMuscle: 'Abdômen' },
    { name: 'Abdominal oblíquo', primaryMuscle: 'Abdômen' },
    { name: 'Abdominal oblíquo no solo', primaryMuscle: 'Abdômen' },
    { name: 'Abdominal oblíquo no cabo', primaryMuscle: 'Abdômen' },
    { name: 'Abdominal remador', primaryMuscle: 'Abdômen' },
    { name: 'Abdominal na polia alta', primaryMuscle: 'Abdômen' },
    { name: 'Abdominal na polia com corda', primaryMuscle: 'Abdômen' },
    { name: 'Abdominal canivete', primaryMuscle: 'Abdômen' },
    { name: 'Abdominal bicicleta', primaryMuscle: 'Abdômen' },
    { name: 'Abdominal crunch', primaryMuscle: 'Abdômen' },
    { name: 'Abdominal crunch com peso', primaryMuscle: 'Abdômen' },
    { name: 'Prancha isométrica', primaryMuscle: 'Abdômen' },
    { name: 'Prancha com apoio nos cotovelos', primaryMuscle: 'Abdômen' },
    { name: 'Prancha lateral', primaryMuscle: 'Abdômen', isUnilateral: true },
    {
      name: 'Prancha com elevação de perna',
      primaryMuscle: 'Abdômen',
    },
    { name: 'Elevação de pernas suspensa', primaryMuscle: 'Abdômen' },
    { name: 'Elevação de pernas na barra fixa', primaryMuscle: 'Abdômen' },
    { name: 'Elevação de pernas deitado', primaryMuscle: 'Abdômen' },
    { name: 'Elevação de joelhos suspensa', primaryMuscle: 'Abdômen' },
    { name: 'Russian twist com peso', primaryMuscle: 'Abdômen' },
    { name: 'Russian twist sem peso', primaryMuscle: 'Abdômen' },
    { name: 'Mountain climber', primaryMuscle: 'Abdômen' },
    { name: 'Abdominal na máquina', primaryMuscle: 'Abdômen' },
    { name: 'Abdominal na bola suíça', primaryMuscle: 'Abdômen' },
    { name: 'V-up', primaryMuscle: 'Abdômen' },

    // TRAPÉZIO
    { name: 'Encolhimento com barra', primaryMuscle: 'Trapézio' },
    { name: 'Encolhimento com halteres', primaryMuscle: 'Trapézio' },
    { name: 'Encolhimento com barra pela frente', primaryMuscle: 'Trapézio' },
    { name: 'Encolhimento com barra por trás', primaryMuscle: 'Trapézio' },
    { name: 'Encolhimento na máquina', primaryMuscle: 'Trapézio' },
    { name: 'Encolhimento no Smith', primaryMuscle: 'Trapézio' },
    {
      name: 'Encolhimento unilateral com halteres',
      primaryMuscle: 'Trapézio',
      isUnilateral: true,
    },
    {
      name: 'Encolhimento unilateral no cabo',
      primaryMuscle: 'Trapézio',
      isUnilateral: true,
    },
    { name: 'Remada alta com barra', primaryMuscle: 'Trapézio' },
    { name: 'Remada alta com halteres', primaryMuscle: 'Trapézio' },
    { name: 'Remada alta no cabo', primaryMuscle: 'Trapézio' },
    { name: 'Remada alta com barra W', primaryMuscle: 'Trapézio' },
    { name: 'Levantamento terra', primaryMuscle: 'Trapézio' },
    { name: 'Farmer walk com halteres', primaryMuscle: 'Trapézio' },
    { name: 'Farmer walk com kettlebell', primaryMuscle: 'Trapézio' },

    // ANTEBRAÇO
    { name: 'Rosca punho com barra', primaryMuscle: 'Antebraço' },
    { name: 'Rosca punho com halteres', primaryMuscle: 'Antebraço' },
    { name: 'Rosca punho inversa com barra', primaryMuscle: 'Antebraço' },
    { name: 'Rosca punho inversa com halteres', primaryMuscle: 'Antebraço' },
    {
      name: 'Rosca punho unilateral',
      primaryMuscle: 'Antebraço',
      isUnilateral: true,
    },
    { name: 'Farmer walk com halteres', primaryMuscle: 'Antebraço' },
    { name: 'Farmer walk com kettlebell', primaryMuscle: 'Antebraço' },
    { name: 'Pronação e supinação com halteres', primaryMuscle: 'Antebraço' },
    { name: 'Pronação e supinação com barra', primaryMuscle: 'Antebraço' },
    { name: 'Rosca martelo', primaryMuscle: 'Antebraço' },
    { name: 'Rosca inversa com barra', primaryMuscle: 'Antebraço' },
    { name: 'Rosca inversa com halteres', primaryMuscle: 'Antebraço' },
    { name: 'Extensão de punho no banco', primaryMuscle: 'Antebraço' },
    { name: 'Flexão de punho no banco', primaryMuscle: 'Antebraço' },
  ];

  for (const ex of exercises) {
    try {
      await upsertExercise(ex, muscleMap);
      console.log('Upserted:', ex.name);
    } catch (err) {
      console.error('Failed to upsert', ex.name, err);
    }
  }

  console.log('Seeding completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
