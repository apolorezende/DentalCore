-- Renomeia tabelas do better-auth para ter prefixo auth_
ALTER TABLE "user" RENAME TO "auth_user";
ALTER TABLE "session" RENAME TO "auth_session";
ALTER TABLE "account" RENAME TO "auth_account";
ALTER TABLE "verification" RENAME TO "auth_verification";

-- Atualiza constraints e índices para refletirem os novos nomes
ALTER INDEX "user_email_key" RENAME TO "auth_user_email_key";
ALTER INDEX "session_token_key" RENAME TO "auth_session_token_key";
