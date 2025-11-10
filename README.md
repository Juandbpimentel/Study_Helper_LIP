# Study_Helper_LIP
Sistema feito para realizar gerenciamento de estudos, cronogramas e revisões para auxiliar durante a jornada universitária.

## Estrutura do Projeto

Este é um monorepo contendo:

### Frontend (`/frontend`)
- **Framework**: Next.js 15 com React
- **Linguagem**: TypeScript
- **Estilização**: Tailwind CSS
- **Gerenciador de Pacotes**: npm

#### Comandos do Frontend
```bash
cd frontend
npm install          # Instalar dependências
npm run dev         # Executar em modo de desenvolvimento
npm run build       # Build para produção
npm run start       # Executar build de produção
npm run lint        # Executar linter
```

### Backend (`/backend`)
- **Framework**: Spring Boot 3.3.5
- **Linguagem**: Java 17
- **Gerenciador de Build**: Gradle
- **Banco de Dados**: PostgreSQL (Supabase)
- **Segurança**: Spring Security com JWT

#### Dependências do Backend
- Spring Web
- Spring Data JPA
- Spring Security
- JWT (jjwt 0.12.6)
- PostgreSQL Driver
- Spring Validation

#### Comandos do Backend
```bash
cd backend
./gradlew build      # Build do projeto
./gradlew test       # Executar testes
./gradlew bootRun    # Executar aplicação
```

## Configuração

### Backend
Edite o arquivo `backend/src/main/resources/application.properties` com suas credenciais do Supabase:
```properties
spring.datasource.url=jdbc:postgresql://your-supabase-url:5432/your-database
spring.datasource.username=your_username
spring.datasource.password=your_password
jwt.secret=your-secret-key
```

### Frontend
Configure as variáveis de ambiente em `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

## Desenvolvimento

1. Inicie o backend na porta 8080
2. Inicie o frontend na porta 3000
3. Acesse o frontend em http://localhost:3000
