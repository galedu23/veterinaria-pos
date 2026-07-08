# Guía: subir VetGram a Netlify

La app ya está lista para desplegarse (el `netlify.toml` de la raíz hace todo el
trabajo de configuración). Hay dos caminos — el **Camino A es el recomendado**
porque cada vez que subas cambios a GitHub, Netlify redespliega solo.

---

## Camino A (recomendado): GitHub + Netlify

### 1. Sube el proyecto a GitHub
El repositorio Git local ya está creado y con su primer commit. Solo falta:

1. Entra a [github.com/new](https://github.com/new) y crea un repositorio
   (ej. `vetgram`), **sin** README ni .gitignore (ya los tenemos).
2. En la terminal, dentro de la carpeta del proyecto:

```bash
git remote add origin https://github.com/TU-USUARIO/vetgram.git
git branch -M main
git push -u origin main
```

### 2. Conecta Netlify
1. Entra a [app.netlify.com](https://app.netlify.com) (crea cuenta gratis con tu GitHub).
2. **Add new site → Import an existing project → GitHub** → autoriza y elige `vetgram`.
3. Netlify detecta Next.js y lee el `netlify.toml` — no cambies nada:
   - Build command: `npm run build`
   - Publish directory: `.next`
4. **Deploy site**. En 2-4 minutos tendrás tu URL: `https://algo.netlify.app`.

### 3. Cada actualización futura
```bash
git add -A
git commit -m "Descripción del cambio"
git push
```
Netlify reconstruye y publica solo. Nada más que hacer.

---

## Camino B: Netlify CLI (sin GitHub)

```bash
npm install -g netlify-cli
netlify login          # abre el navegador para autorizar
netlify init           # crea el sitio (elige "Create & configure a new site")
netlify deploy --build --prod
```

---

## Cosas IMPORTANTES que debes saber antes de compartir la URL

1. **Los datos son de prueba y viven en memoria**: cada visitante ve los datos
   mock desde cero, y todo lo que capture se pierde al recargar. Es perfecto
   para DEMOSTRAR la interfaz, no para operar la clínica todavía.
2. **Las credenciales están quemadas y son públicas** (admin@vet.com/admin123
   está visible en la pantalla de login). Cualquiera con la URL puede entrar.
   No captures datos reales de clientes ahí hasta conectar Supabase Auth.
3. **La PWA funciona en la URL de Netlify**: al abrirla desde el celular,
   Chrome/Safari ofrecerán "Agregar a pantalla de inicio" gracias al
   manifest.json que ya configuramos.
4. **Cuando conectemos Supabase**: las llaves NO van al código ni a Git; se
   agregan en Netlify en *Site settings → Environment variables*
   (`NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`) y se
   redespliega.
