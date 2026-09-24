# Brawl Helper

Companion app non ufficiale per Brawl Stars.

## Architettura attuale
- GitHub Pages: frontend/PWA di test.
- BlackShark / #22QYOQRGY: profilo TEST, usato solo per sviluppo.
- Produzione: ogni cliente inserisce il proprio Player Tag.
- Backend: unico punto autorizzato a custodire la chiave API e interrogare l'API ufficiale.
- Il frontend non contiene chiavi segrete.
- Profili multipli sono gestiti localmente per il test; il backend può successivamente aggiungere account persistence/auth.

## Roadmap tecnica
1. Backend sicuro + cache account.
2. Game Database versionato: brawler, componenti, modalità, mappe, Ranked e patch.
3. Changelog ufficiale Supercell indicizzato e aggiornabile.
4. Meta snapshot stagione/patch/modalità/mappa.
5. Asset cache locale.
6. Recommendation engine.
7. Capacitor/Android Studio -> APK/AAB.
6. AdMob e privacy/consenso.
7. QA e pubblicazione.

## Supercell
Brawl Helper è fan content non ufficiale. Il progetto deve mantenere il disclaimer richiesto e rispettare la Fan Content Policy di Supercell.
