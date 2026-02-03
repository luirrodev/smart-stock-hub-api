export const GOOGLE_AUTH_FLOW_DOCUMENTATION = `
## Flujo de Autenticación con Google

### Cómo funciona:

1. **El usuario hace clic en "Iniciar sesión con Google"** en tu aplicación frontend
2. **Tu frontend redirige al usuario a este endpoint:** \`GET /auth/google/login\`
3. **El servidor redirige automáticamente al usuario a la página de login de Google**
4. **El usuario se autentica en Google** y autoriza tu aplicación
5. **Google redirige al usuario de vuelta a tu aplicación frontend** a la URL: 
   \`\`\`
   {FRONTEND_URL}/auth/callback?access_token={JWT_ACCESS_TOKEN}&refresh_token={JWT_REFRESH_TOKEN}
   \`\`\`

### Configuración requerida en el Frontend:

**IMPORTANTE:** Tu aplicación frontend debe tener una ruta \`/auth/callback\` que:
- Reciba los parámetros \`access_token\` y \`refresh_token\` de la URL
- Guarde estos tokens en localStorage, cookies, o tu gestor de estado
- Redirija al usuario a la página principal de la aplicación

### En caso de error:

Si ocurre algún error durante la autenticación, el usuario será redirigido a:
\`\`\`
{FRONTEND_URL}/auth/error?message={ERROR_MESSAGE}
\`\`\`

Tu frontend también debe tener una ruta \`/auth/error\` para manejar estos casos.`;
