# Study Helper 📚

Sistema de gerenciamento de estudos, cronogramas e revisões para auxiliar durante a jornada universitária.

## 🚀 Quick Start

### Backend
```bash
cd backend
docker-compose up -d
./gradlew bootRun
```
API disponível em: http://localhost:8080

### Frontend
```bash
cd frontend
npm install
npm run dev
```
App disponível em: http://localhost:3000

## 📁 Estrutura

```
Study_Helper_LIP/
├── frontend/          # Next.js + TypeScript + Tailwind
├── backend/           # Spring Boot + Java 21 + PostgreSQL
└── .github/workflows/ # CI/CD automático
```

## 📚 Documentação Completa

- **Backend**: [backend/README.md](backend/README.md)
- **Frontend**: [frontend/README.md](frontend/README.md)
- **CI/CD**: [backend/GITHUB-SECRETS.md](backend/GITHUB-SECRETS.md)

## 🛠️ Tecnologias

**Frontend:** Next.js 15, React 19, TypeScript, Tailwind CSS  
**Backend:** Spring Boot 3, Java 21, PostgreSQL 16, Flyway  
**Infra:** Docker, GitHub Actions, Supabase

## 🤝 Contribuindo

1. Clone o repositório
2. Crie uma branch: `git checkout -b feature/nome`
3. Commit: `git commit -m 'feat: descrição'`
4. Push: `git push origin feature/nome`
5. Abra um Pull Request

Padrão: [Conventional Commits](https://www.conventionalcommits.org/)

## 📝 Licença

MIT License - veja [LICENSE](LICENSE)

## 👤 Autor

**Juan Pimentel** - [@Juandbpimentel](https://github.com/Juandbpimentel)

---

**Feito com ❤️ para estudantes universitários**

