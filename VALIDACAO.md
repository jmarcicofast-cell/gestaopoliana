# Validação da integração Supabase

- Sintaxe JavaScript da interface e integração verificada com Node.
- Combinação de inclusões e edições independentes, conflito no mesmo campo e exclusão com ordem JSONB verificados.
- Acesso anônimo ao banco e à API bloqueado; ativação inicial exige código de uso único.
- Contas sem cadastro ativo em team_members não recebem dados.
- SDK frontend fixado em 2.95.0, sem chave administrativa no repositório.
- Advisories: apenas avisos informativos de RLS sem políticas, intencional porque o acesso direto é revogado; operações passam pela função autenticada.
- Testes de integração usam contas e lançamentos temporários, removidos ao concluir. Dados comerciais não são semeados a partir de imagens.
