-- CreateTable
CREATE TABLE "_ScriptToTopic" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ScriptToTopic_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_ScriptToTopic_B_index" ON "_ScriptToTopic"("B");

-- AddForeignKey
ALTER TABLE "_ScriptToTopic" ADD CONSTRAINT "_ScriptToTopic_A_fkey" FOREIGN KEY ("A") REFERENCES "Script"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ScriptToTopic" ADD CONSTRAINT "_ScriptToTopic_B_fkey" FOREIGN KEY ("B") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
