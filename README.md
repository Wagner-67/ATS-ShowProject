# 🚀 Projekt-Dokumentation: Bewerbungsplattform
 
> **Stack:** Symfony 7 · PHP 8 · MariaDB · Docker

---

## 📌 Projektüberblick

Entwickelt wurde eine mehrbenutzerfähige **Bewerbungsplattform** mit zwei Profiltypen:

| Profiltyp | Beschreibung |
|-----------|--------------|
| **Company** | Unternehmen erstellen Stellenanzeigen, verwalten Bewerbungen & ändern deren Status |
| **Applicant** | Bewerber:innen suchen nach Stellen & reichen PDF-Bewerbungen ein |

---

## 🧱 Backend – Technologien & Architektur

### Framework & Sprache
- **Symfony 7** (PHP 8)
- **Doctrine ORM** mit MariaDB (`10.4.32`)
- **Symfony Messenger** für asynchrone E-Mails
- **Symfony Event Dispatcher** für entkoppelte Logik
- **LexikJWTAuthenticationBundle** + **GesdinetJWTRefreshTokenBundle** für Authentifizierung
- **NelmioCorsBundle** für CORS-Handling mit dem Vue.js-Frontend

### Authentifizierung & Sicherheit
- **JWT Access Token**
- **Refresh Token** als HttpOnly-Cookie (30 Tage gültig)
- **Passwort-Hashing** mit Symfony
- Rollen-basierte Zugriffskontrolle: `ROLE_USER`, `PUBLIC_ACCESS`

### Architekturmuster
- ✅ **Service Layer** – alle Business-Logik ist in Service-Klassen ausgelagert
- ✅ **Event-Driven** – Geocoding & E-Mail-Versand laufen über Symfony Events
- ✅ **Message Queue** – E-Mail-Versand asynchron via Messenger
- ✅ **DTO-ähnliche Responses** – Controller geben strukturierte Arrays zurück
- ✅ **Strict Validation** – serverseitige Validierung mit Symfony Validator + Datei-Magic-Byte-Check
- ✅ **Repository Pattern** – Doctrine Repositories für saubere Datenzugriffe

---

## 🗄️ Datenmodell (Auszug)

### Entitäten & Beziehungen

User (1) ──────< Company (n)
User (1) ──────< Application (n)
Company (1) ────< Application (n) (verknüpft über applicationId)
Application (1)──< UserPdfs (n)


### Wichtige Entitäten im Detail

**User**
- UUID-basierte `userId`
- Enum `ProfileType`: `company` | `applicant`
- JSON-Rollen-System mit automatischer `ROLE_USER`
- Bidirektionale Beziehungen zu `Company` & `Application`

**Company**
- UUID `applicationId` für öffentliche Referenzierung
- Speichert `lat`/`lng` für Geocoding
- `markdown`-Feld für Stellenbeschreibungen
- Automatisches `created_at` in Europe/Berlin

**Application**
- Enum `StatusType`: pending → review → approved/rejected
- PDF-Dokumente als `UserPdfs`-Collection

**UserPdfs**
- Speicherung von Dateiname, Pfad, MIME-Type, Größe
- Magic-Byte-Validierung (`%PDF`-Header)

**RefreshToken**
- Eigene Entity via `GesdinetJWTRefreshTokenBundle`

---

## 🔌 API-Endpunkte

### User
| Methode | Route | Beschreibung |
|---------|-------|--------------|
| `POST` | `/api/user` | Registrierung |
| `GET` | `/api/me` | Aktueller User |

### Company (Stellenanzeigen)
| Methode | Route | Beschreibung |
|---------|-------|--------------|
| `POST` | `/api/company` | Firma/Job erstellen |
| `GET` | `/api/company` | Eigene Firmen abrufen |
| `PUT` | `/api/company/{id}` | Job editieren |
| `DELETE` | `/api/company/{id}` | Job löschen |
| `GET` | `/api/company/application` | Alle Bewerbungen zu eigenen Jobs |
| `POST` | `/api/company/status/{id}` | Bewerbungsstatus ändern |

### Application (Bewerbungen)
| Methode | Route | Beschreibung |
|---------|-------|--------------|
| `POST` | `/api/application/{id}` | Bewerbung einreichen (mit PDFs) |
| `GET` | `/api/applications` | Eigene Bewerbungen |
| `GET` | `/api/application/{id}` | Einzelne Bewerbung |
| `DELETE` | `/api/application/{id}` | Bewerbung löschen |

### Suche & Dokumente
| Methode | Route | Beschreibung |
|---------|-------|--------------|
| `GET` | `/api/search` | Stellen durchsuchen (Pagination) |
| `POST` | `/api/search` | Erweiterte Suche mit Filtern |
| `GET` | `/api/document/{id}` | PDF-Datei abrufen (mit Access-Check) |

---

## ⚡ Besondere Features & Implementierungsdetails

### 1. PDF-Upload mit Sicherheitsvalidierung
```php
// Dateityp-Validierung durch:
- MIME-Type-Check (application/pdf)
- Magic-Byte-Check (Dateiheader '%PDF')
- Dateinamen-Sanitization (Path-Traversal-Schutz)
- Maximale Dateigröße: 20 MB

// Beim Erstellen einer Company wird ein GeolocationEvent dispatched
→ GeolocationListener ruft Nominatim-API auf
→ Straße + Hausnummer + PLZ + Stadt → lat/lng
→ Koordinaten werden direkt in die Company-Entity geschrieben

// ApplicationSubmitEvent → ApplicationSubmitListener
→ EmailService erstellt SendEmailMessage
→ SendEmailMessageHandler versendet via Symfony Mailer
→ Läuft im worker-Container (messenger:consume async)

4. Erweiterte Suche mit Entfernungsberechnung
Haversine-Formel für Distanzberechnung

Bounding-Box-Filter für Performance

Sortierung nach Entfernung möglich

Freitext-Suche über Company-Daten & Markdown-Beschreibung

5. Datei-Download mit Zugriffskontrolle
Prüft, ob User Eigentümer der Bewerbung ist

Oder ob User die Company besitzt, zu der die Bewerbung gehört

6. JWT + Refresh Token Cookie-Flow
Access-Token kurzlebig im Header

Refresh-Token als httpOnly-Cookie

Automatische Token-Erneuerung via /api/token/refresh

Services:
  web:        Symfony-App (Apache, Port 8080)
  worker:     Symfony Messenger Consumer (async Mails)
  frontend:   Node 20, Vue.js Dev Server (Port 5173, Vite HMR)
  db:         MariaDB 10.4.32 (Port 3307)
  phpmyadmin: Datenbank-Admin (Port 8081)

## 🧪 Code-Qualität & Testing

### Statische Code-Analyse mit PHPStan

Das gesamte Projekt wurde mit **PHPStan Level 6** analysiert und ist **vollständig fehlerfrei**.

#### Verwendete Extensions

- `phpstan/phpstan-doctrine` – Doctrine-spezifische Typ-Prüfung
- `phpstan/phpstan-symfony` – Symfony-spezifische Analyse
- `phpstan/extension-installer` – Automatische Extension-Erkennung

#### Ausführung

```bash
php -d memory_limit=512M vendor/bin/phpstan analyse

parameters:
    level: 6
    paths:
        - bin/
        - config/
        - public/
        - src/

    treatPhpDocTypesAsCertain: false

    symfony:
        containerXmlPath: var/cache/dev/App_KernelDevDebugContainer.xml

        Geprüfte Aspekte
✅ Doctrine Entity Column-Type Konsistenz (nullable vs. non-nullable)
✅ Collection Generics (Collection<int, UserPdfs>)
✅ Array-Shape-Dokumentation für Service-Methoden
✅ Parameter-/Return-Type-Konsistenz über Service- und Controller-Layer
✅ Korrekte Parameter-Reihenfolge (required before optional)
✅ instanceof-Checks für getUser()-Rückgaben
✅ Unused Properties & Methods
✅ Deprecated PHP 8.1 Features
♿ Accessibility & Performance
Accessibility-Testing mit axe DevTools

Die gesamte Benutzeroberfläche wurde mit axe DevTools auf Barrierefreiheit geprüft.

Geprüfte Kriterien
✅ Farbkontraste nach WCAG AA
✅ Vollständige Tastatur-Navigation aller interaktiven Elemente
✅ Screenreader-Unterstützung durch ARIA-Labels & Landmarks
✅ Logische und sichtbare Fokus-Reihenfolge
✅ Formularfehler programmatisch mit Eingabefeldern verknüpft
✅ alt-Attribute für Bilder und Icons
✅ Semantische HTML-Struktur (<nav>, <main>, <header>)
✅ Lightbox/Modal mit Tastaturnavigation & Fokus-Management

🚀 Lighthouse Scores

Das Projekt erreicht in den SEO und Barrierefreiheit Kategorien mindestens 90 von 100 Punkten.


📋 Qualitätssicherung im Überblick

| Tool              | Bereich                | Ziel                              |
| ----------------- | ---------------------- | --------------------------------- |
| PHPStan Level 6   | Statische Code-Analyse | Typ-Sicherheit & Fehlervermeidung |
| Symfony Validator | Input-Validierung      | Serverseitige Geschäftsregeln     |
| Magic-Byte-Check  | Datei-Upload           | Sicherheit vor manipulierten PDFs |
| axe DevTools      | Accessibility          | WCAG-Konformität                  |
| Lighthouse        | Performance & SEO      | User Experience & Auffindbarkeit  |

Rate Limiting listener via clientIp
