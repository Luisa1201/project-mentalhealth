Este documento explica paso a paso cómo integrar GitHub como proveedor de autenticación usando NextAuth (Auth.js) dentro de un proyecto Next.js.

Requisitos Previos
<!-- Lista de cosas necesarias antes de iniciar la integración. -->

Antes de comenzar asegúrate de tener:

Un proyecto Next.js instalado.

NextAuth/Auth.js agregado al proyecto.

Una cuenta en GitHub.

(Opcional) Un repositorio creado.

🧩 1. Crear una OAuth App en GitHub
<!-- Sección donde se indica cómo obtener las credenciales necesarias desde GitHub. -->

Ve a:
GitHub → Settings → Developer settings → OAuth Apps

Clic en: New OAuth App

Completa el formulario con la configuración recomendada:

Configuración:
<!-- "Homepage URL" es donde vive tu app. "Callback URL" es la ruta que GitHub usará para retornar el token. -->

Application name:
Autenticación GitHub NextAuth

Homepage URL:
http://localhost:3000

Authorization callback URL:
http://localhost:3000/api/auth/callback/github

Guarda los cambios.

Obtendrás:

Client ID

Client Secret (clic en "Generate new client secret")

Estas dos claves se usan para comunicar tu proyecto con GitHub.

🔐 2. Configurar Variables de Entorno
<!-- Aquí se agregan las claves obtenidas a un archivo .env.local. -->

En tu archivo .env.local agrega:

GITHUB_CLIENT_ID=tu_client_id
GITHUB_CLIENT_SECRET=tu_client_secret
AUTH_SECRET=clave_segura_generada
AUTH_URL=http://localhost:3000

<!-- El AUTH_SECRET es importante para firmar cookies y tokens. -->

Para generar un AUTH_SECRET seguro:

openssl rand -base64 32

⚙️ 3. Configurar NextAuth con GitHub Provider
<!-- NextAuth necesita una ruta API para operar. -->

Crea el archivo:

/app/api/auth/[...nextauth]/route.js


Y agrega:

import NextAuth from "next-auth";
import GitHubProvider from "next-auth/providers/github";

export const authOptions = {
  providers: [
    GitHubProvider({
      // Estas variables vienen del .env.local
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    }),
  ],
  // Secret para firmar las sesiones
  secret: process.env.AUTH_SECRET,
};

// Inicializa NextAuth con esta config
const handler = NextAuth(authOptions);

// Exportación requerida por Next.js para manejar GET y POST
export { handler as GET, handler as POST };

🧪 4. Crear un botón de autenticación
<!-- Este componente muestra al usuario un botón para iniciar sesión o cerrar sesión dependiendo de su estado actual. -->
"use client";
import { signIn, signOut, useSession } from "next-auth/react";

export default function LoginButton() {
  const { data: session } = useSession();

  // Si hay sesión activa, se muestra el nombre del usuario y botón salir
  if (session) {
    return (
      <>
        <p>Hola, {session.user.name}</p>
        <button onClick={() => signOut()}>Cerrar sesión</button>
      </>
    );
  }

  // Si no hay sesión, se muestra el botón para iniciar con GitHub
  return (
    <button onClick={() => signIn("github")}>
      Iniciar sesión con GitHub
    </button>
  );
}

📡 5. Callback URL
<!-- Esta ruta es generada automáticamente por NextAuth. -->
GitHub devolverá al usuario a:
http://localhost:3000/api/auth/callback/github
NextAuth detecta esta ruta sin necesidad de crearla manualmente.


🔎 6. Obtener sesión desde el servidor
<!-- Ejemplo para verificar autenticación desde un endpoint o página server-side. -->
import { getServerSession } from "next-auth";

export async function GET(req) {
  // Obtiene la sesión del usuario
  const session = await getServerSession();

  return Response.json({
    authenticated: !!session,
    session,
  });
}

🛠️ 7. Comandos útiles
<!-- Comandos necesarios para instalar y correr el proyecto. -->

Instalar NextAuth:
npm install next-auth
Iniciar proyecto:
npm run dev


✔️ 8. Conclusión

Con esta configuración ya puedes:
Autenticar usuarios mediante GitHub
Obtener su nombre, email, avatar
Manejar sesiones en cliente y servidor
Integrar NextAuth profesionalmente en tu app Next.js