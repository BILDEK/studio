# VerdantFlow

VerdantFlow is a comprehensive application designed to streamline various business operations. It provides features for customer management, employee tracking, stock management, and task oversight, with a key focus on optimizing workflows through AI-powered suggestions.

## Features

*   **Customer Login:** Secure membership login for customers.
*   **Employee Tracking:** Employee management dashboard with detailed activity tracking.
*   **Stock Management:** Inventory control to manage stock levels and updates.
*   **Task Oversight:** Workflow manager to oversee and track tasks and processes.
*   **Workflow Optimizer:** AI-powered suggestion tool that helps users optimize workflows based on tasks.
*   **Dynamic Theming:** Users can choose between Light, Dark, and a special Cyberpunk theme.

## Technologies Used

*   Next.js
*   React
*   TypeScript
*   Tailwind CSS
*   GenKit (for AI features)

## Getting Started

To get a local copy up and running, follow these steps:

1.  Clone the repository:
    ```bash
    git clone https://github.com/BILDEK/studio.git
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Run the development server:
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Tema Yönetimi

Uygulama, kullanıcıların **Profil > Appearance** (Görünüm) ayarları sayfasından seçebileceği üç farklı görsel temayı desteklemektedir: Aydınlık (Light), Karanlık (Dark) ve Cyberpunk.

### Uygulama Detayları ve Çözülen Sorun

Başlangıçta proje, tema değişikliklerini yönetmek için `next-themes` kütüphanesini kullanıyordu. Ancak, "Cyberpunk" teması seçildiğinde doğru bir şekilde uygulanmıyor ve diğer temalara geri dönmeyi engelliyordu.

Bu sorunu çözmek ve tema geçişlerini daha güvenilir hale getirmek için `next-themes` kütüphanesi yerine doğrudan DOM manipülasyonu yapan manuel bir yaklaşım benimsenmiştir.

Mevcut çözüm aşağıdaki adımları içerir:
*   `src/app/profile/page.tsx` dosyasındaki `AppearanceSettings` bileşeni içinde, seçili temayı takip etmek için bir `useState` (activeTheme) kullanılır.
*   `handleThemeChange` adında bir fonksiyon, kök `<html>` elementinin `className` özelliğini doğrudan değiştirir:
    *   **Aydınlık Tema:** `className` boş (`''`) olarak ayarlanır.
    *   **Karanlık Tema:** `className` `dark` olarak ayarlanır.
    *   **Cyberpunk Tema:** `className` `cyber-punk` olarak ayarlanır.

Bu yaklaşım, tema sınıfları üzerinde tam kontrol sağlayarak karşılaşılan geçiş sorununu tamamen çözmüştür.

```typescript
// src/app/profile/page.tsx -> AppearanceSettings Bileşeni

function AppearanceSettings() {
  const [activeTheme, setActiveTheme] = useState("")

  // Bileşen yüklendiğinde mevcut temayı HTML etiketinden kontrol et
  useEffect(() => {
    const currentClass = document.documentElement.className
    if (currentClass === 'dark' || currentClass === 'cyber-punk') {
      setActiveTheme(currentClass)
    } else {
      setActiveTheme('light')
    }
  }, [])

  // Temayı manuel olarak değiştiren fonksiyon
  const handleThemeChange = (newTheme: string) => {
    const themeClass = newTheme === "light" ? "" : newTheme
    document.documentElement.className = themeClass
    setActiveTheme(newTheme)
  }

  // ... Butonların JSX kodları onClick olayında handleThemeChange fonksiyonunu çağırır.
}
```
Bu yöntem, uygulama genelinde sağlam ve öngörülebilir bir tema yönetimi sağlar.
