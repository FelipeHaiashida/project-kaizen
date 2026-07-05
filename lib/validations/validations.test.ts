import { describe, it, expect } from "vitest";

import { slugify, createWorkspaceSchema, SLUG_REGEX } from "@/lib/validations/workspace";
import { loginSchema, registerSchema } from "@/lib/validations/auth";

describe("slugify", () => {
  it("normaliza acentos e espaços", () => {
    expect(slugify("Equipe Produção")).toBe("equipe-producao");
  });

  it("remove pontuação e hífens nas pontas", () => {
    expect(slugify("  --Olá, Mundo!!  ")).toBe("ola-mundo");
  });

  it("limita a 40 caracteres", () => {
    expect(slugify("a".repeat(60)).length).toBeLessThanOrEqual(40);
  });

  it("sempre gera um slug válido pelo SLUG_REGEX", () => {
    for (const input of ["Minha Equipe 2", "Café com Leite", "Time-A/B"]) {
      expect(SLUG_REGEX.test(slugify(input))).toBe(true);
    }
  });
});

describe("createWorkspaceSchema", () => {
  it("aceita dados válidos", () => {
    expect(createWorkspaceSchema.safeParse({ name: "Equipe", slug: "equipe" }).success).toBe(true);
  });

  it("rejeita slug com maiúsculas ou espaços", () => {
    expect(createWorkspaceSchema.safeParse({ name: "Equipe", slug: "Equipe X" }).success).toBe(
      false
    );
  });

  it("rejeita nome muito curto", () => {
    expect(createWorkspaceSchema.safeParse({ name: "E", slug: "equipe" }).success).toBe(false);
  });
});

describe("schemas de autenticação", () => {
  it("loginSchema valida formato de email", () => {
    expect(loginSchema.safeParse({ email: "invalido", password: "x" }).success).toBe(false);
    expect(loginSchema.safeParse({ email: "a@b.com", password: "x" }).success).toBe(true);
  });

  it("registerSchema exige senha com ao menos 8 caracteres", () => {
    const base = { name: "Ana", email: "a@b.com" };
    expect(registerSchema.safeParse({ ...base, password: "1234567" }).success).toBe(false);
    expect(registerSchema.safeParse({ ...base, password: "12345678" }).success).toBe(true);
  });
});
