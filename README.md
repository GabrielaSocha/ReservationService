# ReservationService – instrukcja uruchomienia projektu

## Opis projektu
ReservationService to aplikacja webowa umożliwiająca sprawdzanie dostępności stolików oraz tworzenie rezerwacji.
Projekt składa się z:
- **Backendu** (ASP.NET Core + EF Core)
- **Frontendu** (React + Vite)
- **Bazy danych** PostgreSQL
- **Cache** Redis

Całość uruchamiana jest przy użyciu **Docker Compose**.

---

## Wymagania
Aby uruchomić projekt, wymagane jest:
- Docker Desktop (Windows / macOS / Linux)
- Docker Compose (wbudowany w Docker Desktop)
- (opcjonalnie) Git – do pobrania repozytorium

---

## Pobranie projektu
```bash
git clone https://github.com/GabrielaSocha/ReservationService.git
cd ReservationService
```

---

## Uruchomienie projektu
Należy w pierwszej kolejności mieć uruchomiony Docker Desktop

W katalogu głównym projektu należy wykonać:
```bash
docker compose up -d --build
```

Docker:
- zbuduje obrazy frontendu i backendu
- uruchomi kontenery: API, frontend, PostgreSQL oraz Redis
- wykona migracje bazy danych
- zseeduje dane początkowe

Sprawdzenie statusu kontenerów:
```bash
docker compose ps
```

Wszystkie serwisy powinny mieć status **Up**.

---

## Adresy aplikacji
Po poprawnym uruchomieniu:
- **Frontend (aplikacja webowa):**  
  http://localhost:5174

- **Backend – Swagger UI:**  
  http://localhost:7215/swagger
