# hubackovafoto.cz — web fotografky Nikoly Hubáčkové

Statický web na **Cloudflare Pages**. Nasazuje se automaticky při každém pushi
do `main`, bez build příkazu, výstupní složka je kořen repozitáře.

## Struktura

```
index.html                    hlavní stránka (styly vložené v <head>)
main.js                       menu, galerie, lightbox, formulář, mapa, souhlas s cookies
dekujeme.html                 poděkování po odeslání formuláře (noindex)
ochrana-osobnich-udaju.html   zásady ochrany osobních údajů a cookies
privacy.js                    tlačítko „Změnit nastavení cookies“ na stránce zásad
404.html                      stránka nenalezena (Pages ji vrací sám)
fonts/                        písma Cormorant Garamond a Jost (woff2, SIL OFL) + fonts.css
images/                       fotky (WebP)
og.jpg                        obrázek pro sdílení na sítích (1200×630)
_headers                      bezpečnostní hlavičky (CSP, HSTS) a cache
robots.txt, sitemap.xml, llms.txt, site.webmanifest, favicony
```

## Jak věci fungují

- **Formulář** odesílá přes [Web3Forms](https://web3forms.com) (klíč `access_key`
  v `index.html`, veřejný — tak to Web3Forms počítá). Skryté pole `botcheck` chytá roboty.
  Při chybě se zobrazí hláška s e-mailem a telefonem, po úspěchu přesměrování na `/dekujeme`.
- **Google Analytics** (`G-GPTE9Y6YJV`) se načte **až po souhlasu** v cookie liště
  (`main.js`). Volba se ukládá do `localStorage` (`cookie-consent`), změnit jde
  v patičce („Nastavení cookies“) nebo na stránce zásad.
- **Mapa Google** se načte až po kliknutí na „Zobrazit mapu“.
- **Písma** jsou hostovaná na webu, nic se nenačítá z Google Fonts.
- **CSP** v `_headers` povoluje jen vlastní skripty + Google Analytics, Web3Forms
  a Google Maps. Když se přidá nová externí služba, je potřeba ji tam doplnit.
  Inline `<script>` (kromě JSON-LD) ani `onclick=""` nepoužívat — CSP je zablokuje.
- Čisté adresy: Pages servíruje `ochrana-osobnich-udaju.html` na `/ochrana-osobnich-udaju`.

## Úpravy obsahu

- Texty v `index.html`. Mezi jednopísmenné předložky/spojky (v, s, k, z, o, u, a, i)
  a následující slovo a mezi číslo a jednotku (`4&nbsp;000&nbsp;Kč`) psát `&nbsp;`.
- Ceny a FAQ jsou na webu **i ve schema.org** (JSON-LD v `<head>`) a v `llms.txt` —
  při změně upravit na všech místech.
- Nové fotky: WebP do `images/`, v `<img>` uvést skutečné `width`/`height`.
  Do galerie ideálně delší strana 1600 px (lightbox je ukazuje velké).
- Po změně obsahu aktualizovat `lastmod` v `sitemap.xml`.

## Co zbývá

- [ ] IČO do patičky a schema.org (podnikatel ho musí na webu uvádět)
- [ ] Fotky galerie ve větším rozlišení (teď 500 px)
- [ ] Ověřit otevírací dobu ve schema.org (Po–Ne 8–20)
- [ ] Formulář přes vlastní funkci + Resend místo Web3Forms (jako stavbyliterak)
- [ ] Recenze klientů, podstránky jednotlivých služeb
- [ ] Google Search Console + Seznam Webmaster, Firemní profil Google se stejnou adresou
