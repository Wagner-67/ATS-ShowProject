🚀 Projekt-Dokumentation: Bewerbungsplattform
Stack: Symfony 7 · PHP 8 · MariaDB · Docker · Vue.js 3 · Leaflet

📌 Projektüberblick
Entwickelt wurde eine mehrbenutzerfähige Bewerbungsplattform mit zwei Profiltypen:

Profiltyp	Beschreibung
Company	Unternehmen erstellen Stellenanzeigen, verwalten Bewerbungen & ändern deren Status
Applicant	Bewerber:innen suchen nach Stellen & reichen PDF-Bewerbungen ein
🧱 Backend – Technologien & Architektur
Framework & Sprache
Symfony 7 (PHP 8)

Doctrine ORM mit MariaDB (10.4.32)

Symfony Messenger für asynchrone E-Mails

Symfony Event Dispatcher für entkoppelte Logik

LexikJWTAuthenticationBundle + GesdinetJWTRefreshTokenBundle für Authentifizierung

NelmioCorsBundle für CORS-Handling mit dem Vue.js-Frontend

Authentifizierung & Sicherheit
JWT Access Token

Refresh Token als HttpOnly-Cookie (30 Tage gültig)

Passwort-Hashing mit Symfony

Rollen-basierte Zugriffskontrolle: ROLE_USER, PUBLIC_ACCESS

Architekturmuster
✅ Service Layer – alle Business-Logik ist in Service-Klassen ausgelagert

✅ Event-Driven – Geocoding & E-Mail-Versand laufen über Symfony Events

✅ Message Queue – E-Mail-Versand asynchron via Messenger

✅ DTO-ähnliche Responses – Controller geben strukturierte Arrays zurück

✅ Strict Validation – serverseitige Validierung mit Symfony Validator + Datei-Magic-Byte-Check

✅ Repository Pattern – Doctrine Repositories für saubere Datenzugriffe

🎨 Frontend – Technologien & Architektur
Framework & Build-Tools
Vue.js 3 (Composition API)

Vite als Build-Tool mit HMR (Hot Module Replacement)

React Router für clientseitiges Routing

Axios für API-Kommunikation

Leaflet + React-Leaflet für interaktive Kartendarstellung

CSS Modules für komponentenspezifisches Styling

Kernfunktionen
Landingpage mit Listen-/Kartenansicht (Split-View)

Umkreissuche mit visuellem Radius auf der Karte

Erweiterte Suche mit Filterung nach Typ, Text & Standort

Bewerbungsformular mit Drag & Drop PDF-Upload

Benutzer-Authentifizierung mit Login/Register/Profil

Responsive Design für Mobile & Desktop

State Management
Lokaler State mit useState Hooks pro Komponente

Props-Drilling für Navigation und Auth-Status

Browser LocalStorage für Token-Persistenz

♿ Accessibility – axe DevTools Konformität
Die Plattform wurde mit der axe DevTools Browser-Extension auf WCAG 2.1 AA-Konformität geprüft und optimiert. Folgende Accessibility-Standards wurden implementiert:

Semantische HTML-Landmarks
Landmark	Element	Beschreibung
banner	<header role="banner">	Hero-Bereich mit Titel
navigation	<nav role="navigation" aria-label="Hauptnavigation">	Hauptmenü
main	<main role="main" aria-label="Hauptinhalt">	Zentraler Content-Bereich
search	<form role="search" aria-label="Bewerbungssuche">	Suchformular
complementary	<aside>, <div role="complementary">	Legende & Hinweise
dialog	role="dialog" aria-modal="true"	Detail-Modal
Interaktive Elemente
Element	ARIA-Attribute	Beschreibung
Icon-Buttons	aria-label="..."	Alle Icon-Buttons haben beschreibende Labels
SVGs	aria-hidden="true"	Dekorative Icons sind für Screenreader versteckt
Dropdown-Menüs	aria-expanded, aria-haspopup	Status des Menüs wird kommuniziert
Tabs	role="tablist", role="tab", aria-selected	View-Toggle (Liste/Karte)
Cards	<article> mit Tastaturnavigation	Enter/Space zum Öffnen
Modal	aria-modal="true", aria-labelledby	Korrekte Modal-Semantik
Favoriten-Button	aria-pressed	Toggle-Status wird angezeigt
Formulare & Eingaben
Element	Verbesserung
Select-Felder	Explizite <label> mit htmlFor/id-Verknüpfung
Screenreader-Only Labels	.sr-only Klasse für visuell versteckte Labels
Live-Regions	aria-live="polite" für Suchergebnisse, role="status" für Geocoding-Status
Fehlermeldungen	role="alert" für dynamische Fehler
Datei-Upload-Zone	role="button", Tastatur-Support mit Enter/Space
Tastaturnavigation
Tab-Reihenfolge folgt visuellem Layout

Esc schließt Modals und Dropdowns

Enter/Space aktiviert klickbare Cards und Upload-Zonen

Focus-Management bei Modal-Öffnung/Schließung

Farben & Kontrast
Ausreichender Farbkontrast für Text und interaktive Elemente

Fokus-Indikatoren mit sichtbarem Outline

Status-Informationen nicht nur über Farbe kommuniziert

🗄️ Datenmodell (Auszug)
Entitäten & Beziehungen
text
User (1) ──────< Company (n)
User (1) ──────< Application (n)
Company (1) ────< Application (n) (verknüpft über applicationId)
Application (1)──< UserPdfs (n)
Wichtige Entitäten im Detail
User

UUID-basierte userId

Enum ProfileType: company | applicant

JSON-Rollen-System mit automatischer ROLE_USER

Bidirektionale Beziehungen zu Company & Application

Company

UUID applicationId für öffentliche Referenzierung

Speichert lat/lng für Geocoding

markdown-Feld für Stellenbeschreibungen

Automatisches created_at in Europe/Berlin

Application

Enum Salutation: Herr, Frau, Divers

Enum StatusType: pending → review → approved/rejected

PDF-Dokumente als UserPdfs-Collection

UserPdfs

Speicherung von Dateiname, Pfad, MIME-Type, Größe

Magic-Byte-Validierung (%PDF-Header)

RefreshToken

Eigene Entity via GesdinetJWTRefreshTokenBundle

🔌 API-Endpunkte
User
Methode	Route	Beschreibung
POST	/api/user	Registrierung
GET	/api/me	Aktueller User
Company (Stellenanzeigen)
Methode	Route	Beschreibung
POST	/api/company	Firma/Job erstellen
GET	/api/company	Eigene Firmen abrufen
PUT	/api/company/{id}	Job editieren
DELETE	/api/company/{id}	Job löschen
GET	/api/company/application	Alle Bewerbungen zu eigenen Jobs
POST	/api/company/status/{id}	Bewerbungsstatus ändern
Application (Bewerbungen)
Methode	Route	Beschreibung
POST	/api/application/{id}	Bewerbung einreichen (mit PDFs)
GET	/api/applications	Eigene Bewerbungen
GET	/api/application/{id}	Einzelne Bewerbung
DELETE	/api/application/{id}	Bewerbung löschen
Suche & Dokumente
Methode	Route	Beschreibung
GET	/api/search	Stellen durchsuchen (Pagination)
POST	/api/search	Erweiterte Suche mit Filtern
GET	/api/document/{id}	PDF-Datei abrufen (mit Access-Check)
⚡ Besondere Features & Implementierungsdetails
1. PDF-Upload mit Sicherheitsvalidierung
php
// Dateityp-Validierung durch:
- MIME-Type-Check (application/pdf)
- Magic-Byte-Check (Dateiheader '%PDF')
- Dateinamen-Sanitization (Path-Traversal-Schutz)
- Maximale Dateigröße: 20 MB
2. Automatisches Geocoding
php
// Beim Erstellen einer Company wird ein GeolocationEvent dispatched
→ GeolocationListener ruft Nominatim-API auf
→ Straße + Hausnummer + PLZ + Stadt → lat/lng
→ Koordinaten werden direkt in die Company-Entity geschrieben
3. Asynchroner E-Mail-Versand
php
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

🐳 Docker-Services
Service	Beschreibung	Port
web	Symfony-App (Apache)	8080
worker	Symfony Messenger Consumer (async Mails)	-
frontend	Node 20, Vue.js Dev Server (Vite HMR)	5173
db	MariaDB 10.4.32	3307
phpmyadmin	Datenbank-Admin	8081
🧪 Testing & Qualitätssicherung
Accessibility Testing
axe DevTools Browser-Extension für automatisierte WCAG-Prüfungen

Manuelle Tests mit Screenreader (NVDA/VoiceOver)

Tastaturnavigation-Tests für alle interaktiven Elemente

Kontrast-Prüfung für Textfarben und UI-Elemente

axe DevTools Prüfbericht (Zusammenfassung)
Kategorie	Status
Buttons haben erkennbaren Text	✅ Bestanden
Formularelemente haben Labels	✅ Bestanden
Dokument hat Haupt-Landmark	✅ Bestanden
Keine verschachtelten interaktiven Elemente	✅ Bestanden
ARIA-Rollen sind gültig	✅ Bestanden
Banner-Landmark auf oberster Ebene	✅ Bestanden
Farbkontrast ausreichend	✅ Bestanden
Tastaturzugänglichkeit	✅ Bestanden
📁 Projektstruktur
text
/
├── backend/                 # Symfony 7 API
│   ├── src/
│   │   ├── Controller/      # API-Controller
│   │   ├── Entity/          # Doctrine-Entitäten
│   │   ├── Event/           # Events & Listener
│   │   ├── Message/         # Messenger Messages & Handler
│   │   ├── Repository/      # Doctrine-Repositories
│   │   ├── Service/         # Business-Logik Services
│   │   └── Validator/       # Custom Validators
│   ├── config/              # Symfony-Konfiguration
│   └── migrations/          # Datenbank-Migrationen
├── frontend/                # Vue.js 3 SPA
│   ├── src/
│   │   ├── components/      # React-Komponenten
│   │   ├── pages/           # Seiten-Komponenten
│   │   └── styles/          # CSS-Dateien
│   └── public/              # Statische Assets
├── docker/                  # Docker-Konfiguration
└── docker-compose.yml       # Service-Orchestrierung
