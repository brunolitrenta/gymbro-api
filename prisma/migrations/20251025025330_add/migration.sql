-- CreateEnum
CREATE TYPE "public"."userType" AS ENUM ('trainer', 'normal');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "type" "public"."userType" NOT NULL DEFAULT 'normal',
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "gender" TEXT,
    "birthDate" TIMESTAMP(3),
    "weight" DOUBLE PRECISION,
    "height" DOUBLE PRECISION,
    "goal" TEXT,
    "medical" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TrainerRelation" (
    "trainerId" TEXT NOT NULL,
    "studentEmail" TEXT NOT NULL,
    "nickname" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrainerRelation_pkey" PRIMARY KEY ("trainerId","studentEmail")
);

-- CreateTable
CREATE TABLE "public"."Plan" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Workout" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "day" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Workout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ExerciseDefinition" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isUnilateral" BOOLEAN NOT NULL DEFAULT false,
    "videoUrl" TEXT,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExerciseDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MuscleGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "MuscleGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Equipment" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ExerciseDefinitionOnMuscleGroup" (
    "exerciseDefinitionId" TEXT NOT NULL,
    "muscleGroupId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ExerciseDefinitionOnMuscleGroup_pkey" PRIMARY KEY ("exerciseDefinitionId","muscleGroupId")
);

-- CreateTable
CREATE TABLE "public"."ExerciseDefinitionOnEquipment" (
    "exerciseDefinitionId" TEXT NOT NULL,
    "equipmentId" TEXT NOT NULL,

    CONSTRAINT "ExerciseDefinitionOnEquipment_pkey" PRIMARY KEY ("exerciseDefinitionId","equipmentId")
);

-- CreateTable
CREATE TABLE "public"."WorkoutExercise" (
    "id" TEXT NOT NULL,
    "workoutId" TEXT NOT NULL,
    "exerciseDefId" TEXT NOT NULL,
    "sets" INTEGER,
    "reps" INTEGER,
    "restSeconds" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkoutExercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WorkoutSession" (
    "id" TEXT NOT NULL,
    "workoutId" TEXT,
    "userId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "WorkoutSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SetLog" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "workoutExerciseId" TEXT,
    "setNumber" INTEGER NOT NULL,
    "weightKg" DECIMAL(65,30),
    "reps" INTEGER,
    "distanceM" DECIMAL(65,30),
    "durationSeconds" INTEGER,
    "notes" TEXT,

    CONSTRAINT "SetLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WeightHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "weightKg" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WeightHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "TrainerRelation_studentEmail_idx" ON "public"."TrainerRelation"("studentEmail");

-- CreateIndex
CREATE INDEX "Plan_authorId_idx" ON "public"."Plan"("authorId");

-- CreateIndex
CREATE INDEX "Workout_planId_idx" ON "public"."Workout"("planId");

-- CreateIndex
CREATE UNIQUE INDEX "Workout_planId_day_key" ON "public"."Workout"("planId", "day");

-- CreateIndex
CREATE UNIQUE INDEX "ExerciseDefinition_name_key" ON "public"."ExerciseDefinition"("name");

-- CreateIndex
CREATE UNIQUE INDEX "MuscleGroup_name_key" ON "public"."MuscleGroup"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Equipment_name_key" ON "public"."Equipment"("name");

-- CreateIndex
CREATE INDEX "ExerciseDefinitionOnMuscleGroup_muscleGroupId_idx" ON "public"."ExerciseDefinitionOnMuscleGroup"("muscleGroupId");

-- CreateIndex
CREATE INDEX "ExerciseDefinitionOnEquipment_equipmentId_idx" ON "public"."ExerciseDefinitionOnEquipment"("equipmentId");

-- CreateIndex
CREATE INDEX "WorkoutExercise_workoutId_idx" ON "public"."WorkoutExercise"("workoutId");

-- CreateIndex
CREATE INDEX "WorkoutExercise_exerciseDefId_idx" ON "public"."WorkoutExercise"("exerciseDefId");

-- CreateIndex
CREATE INDEX "WorkoutSession_userId_startedAt_idx" ON "public"."WorkoutSession"("userId", "startedAt");

-- CreateIndex
CREATE INDEX "SetLog_sessionId_idx" ON "public"."SetLog"("sessionId");

-- CreateIndex
CREATE INDEX "SetLog_workoutExerciseId_idx" ON "public"."SetLog"("workoutExerciseId");

-- CreateIndex
CREATE INDEX "WeightHistory_userId_date_idx" ON "public"."WeightHistory"("userId", "date");

-- AddForeignKey
ALTER TABLE "public"."TrainerRelation" ADD CONSTRAINT "TrainerRelation_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TrainerRelation" ADD CONSTRAINT "TrainerRelation_studentEmail_fkey" FOREIGN KEY ("studentEmail") REFERENCES "public"."User"("email") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Plan" ADD CONSTRAINT "Plan_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Workout" ADD CONSTRAINT "Workout_planId_fkey" FOREIGN KEY ("planId") REFERENCES "public"."Plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ExerciseDefinitionOnMuscleGroup" ADD CONSTRAINT "ExerciseDefinitionOnMuscleGroup_exerciseDefinitionId_fkey" FOREIGN KEY ("exerciseDefinitionId") REFERENCES "public"."ExerciseDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ExerciseDefinitionOnMuscleGroup" ADD CONSTRAINT "ExerciseDefinitionOnMuscleGroup_muscleGroupId_fkey" FOREIGN KEY ("muscleGroupId") REFERENCES "public"."MuscleGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ExerciseDefinitionOnEquipment" ADD CONSTRAINT "ExerciseDefinitionOnEquipment_exerciseDefinitionId_fkey" FOREIGN KEY ("exerciseDefinitionId") REFERENCES "public"."ExerciseDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ExerciseDefinitionOnEquipment" ADD CONSTRAINT "ExerciseDefinitionOnEquipment_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "public"."Equipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkoutExercise" ADD CONSTRAINT "WorkoutExercise_workoutId_fkey" FOREIGN KEY ("workoutId") REFERENCES "public"."Workout"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkoutExercise" ADD CONSTRAINT "WorkoutExercise_exerciseDefId_fkey" FOREIGN KEY ("exerciseDefId") REFERENCES "public"."ExerciseDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkoutSession" ADD CONSTRAINT "WorkoutSession_workoutId_fkey" FOREIGN KEY ("workoutId") REFERENCES "public"."Workout"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkoutSession" ADD CONSTRAINT "WorkoutSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SetLog" ADD CONSTRAINT "SetLog_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."WorkoutSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SetLog" ADD CONSTRAINT "SetLog_workoutExerciseId_fkey" FOREIGN KEY ("workoutExerciseId") REFERENCES "public"."WorkoutExercise"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WeightHistory" ADD CONSTRAINT "WeightHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
