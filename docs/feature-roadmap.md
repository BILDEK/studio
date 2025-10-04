# VerdantFlow Geliştirme Yol Haritası

Bu doküman, VerdantFlow uygulamasına eklenecek yeni özellikler için bir yol haritası sunmaktadır.

## 1. Görev Yönetimi Geliştirmeleri

### 1.1. Görev Bağımlılıkları

-   **Veritabanı Şeması:** `tasks` koleksiyonundaki her bir göreve `dependsOn` adında bir alan eklenecektir. Bu alan, görevin başlaması için tamamlanması gereken diğer görevlerin ID'lerini içeren bir dizi olacaktır.
-   **Arayüz Geliştirmeleri:** Görev ekleme/düzenleme formlarına, bir görevin bağımlı olduğu diğer görevleri seçmek için bir arayüz eklenecektir.
-   **İş Mantığı:** Bir görevin durumu "Başlamadı" olarak ayarlandığında, bağımlı olduğu görevlerin tamamlanıp tamamlanmadığı kontrol edilecektir. Eğer bağımlı görevler tamamlanmamışsa, kullanıcıya bir uyarı gösterilecektir.

### 1.2. Alt Görevler (Sub-tasks)

-   **Veritabanı Şeması:** Her bir görev dökümanının içine `subTasks` adında bir alt koleksiyon (sub-collection) oluşturulacaktır. Bu alt koleksiyon, ana görevle aynı yapıya sahip olacaktır.
-   **Arayüz Geliştirmeleri:** Görev detayları görünümünde, alt görevleri listelemek, eklemek, düzenlemek ve silmek için bir bölüm eklenecektir.
-   **İş Mantığı:** Bir ana görevin ilerlemesi (progress), alt görevlerinin tamamlanma durumuna göre otomatik olarak hesaplanabilir.

### 1.3. Yorumlar ve Dosya Ekleme

-   **Veritabanı Şeması:** Her bir görev dökümanının içine `comments` adında bir alt koleksiyon oluşturulacaktır. Yorumlar, metin, kullanıcı ve tarih bilgisi içerecektir. Dosyalar için Firebase Storage kullanılacak ve dosya URL'leri `attachments` adında bir alt koleksiyonda saklanacaktır.
-   **Arayüz Geliştirmeleri:** Görev detayları görünümüne yorum ekleme ve görüntüleme bölümü ile dosya yükleme ve listeleme bölümü eklenecektir.

## 2. Envanter Yönetimi Geliştirmeleri

-   Düşük Stok Uyarıları
-   Tedarikçi Yönetimi
-   Satış/Sipariş Takibi

## 3. Çalışan Yönetimi Geliştirmeleri

-   Rol Tabanlı Erişim Kontrolü (RBAC)
-   İzin/Tatil Yönetimi

## 4. Finans ve Fatura Yönetimi

-   Müşterilere fatura oluşturma, gönderme ve takibi
-   Gider takibi
-   Gelir-gider raporları

## 5. Müşteri İlişkileri Yönetimi (CRM)

-   Müşteri veritabanı
-   Etkileşim kaydı

## 6. Raporlama ve Analitik Paneli

-   Detaylı ve özelleştirilebilir raporlar
-   Veri görselleştirme

## 7. AI Özellikleri Genişletmesi

-   Tahmine Dayalı Analitik
-   Doğal Dil Arayüzü (Chatbot)

---

İlk olarak **Görev Yönetimi Geliştirmeleri** ile başlayacağız. İlk adım olarak **Görev Bağımlılıkları** özelliğini ekleyeceğim.
