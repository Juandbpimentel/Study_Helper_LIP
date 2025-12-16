import Link from "next/link";

export default function GlobalError() {
  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-red-50 text-red-800">
          <div className="max-w-3xl rounded-lg border border-red-200 bg-white p-8 shadow-lg">
            <h1 className="text-2xl font-bold">Ocorreu um erro</h1>
            <p className="mt-4 text-sm text-red-600">
              Desculpe — ocorreu um erro inesperado ao processar a página. Você
              pode voltar para a página inicial e tentar novamente.
            </p>
            <div className="mt-6 flex gap-3">
              <Link href="/" className="ui-btn-cta">
                Ir para a página inicial
              </Link>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
