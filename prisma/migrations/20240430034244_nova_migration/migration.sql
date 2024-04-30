-- CreateTable
CREATE TABLE "admin" (
    "id" TEXT NOT NULL,
    "user" TEXT NOT NULL,
    "password" TEXT NOT NULL,

    CONSTRAINT "admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "game_server_created" BOOLEAN NOT NULL DEFAULT false,
    "game_rule" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rodada" (
    "id" TEXT NOT NULL,
    "nEuro" TEXT NOT NULL,
    "retribuicao" TEXT NOT NULL,
    "qntRetribuicao" TEXT NOT NULL,
    "nRodada" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Rodada_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "whatsapp" TEXT NOT NULL,
    "n_euro" TEXT,
    "grupoId" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "valores" (
    "id" TEXT NOT NULL,
    "total_n_euro" TEXT NOT NULL,
    "total_usuarios" INTEGER NOT NULL,
    "fundo_retido" TEXT NOT NULL,
    "grupoId" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "valores_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admin_user_key" ON "admin"("user");

-- CreateIndex
CREATE UNIQUE INDEX "group_nome_key" ON "group"("nome");

-- AddForeignKey
ALTER TABLE "Rodada" ADD CONSTRAINT "Rodada_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_grupoId_fkey" FOREIGN KEY ("grupoId") REFERENCES "group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "valores" ADD CONSTRAINT "valores_grupoId_fkey" FOREIGN KEY ("grupoId") REFERENCES "group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
