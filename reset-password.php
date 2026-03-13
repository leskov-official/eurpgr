<!DOCTYPE html>
<html lang="et">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>EUROPAGAR - Parooli taastamine</title>

  <meta name="description" content="EUROPAGAR — kondiitritooted, eritellimused ja teenused." />
  <meta property="og:image" content="images/ICON.png" />

  <link rel="icon" type="image/png" sizes="32x32" href="images/dark-favicon.png?v=2">
  <link rel="apple-touch-icon" sizes="180x180" href="images/apple-touch-icon.webp" />
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
  <link rel="canonical" href="https://eurpgr.ee/reset-password.php">
  <link rel="sitemap" type="application/xml" href="sitemap.xml">
<link rel="stylesheet" href="styles/header_footer.css">
  <link rel="stylesheet" href="styles/cookie.css">
<link rel="stylesheet" href="styles/reset-password.css">


</head>

<body data-page-key="reset_password">

<div id="cookie-consent-bar" aria-hidden="true">
<div class="cookie-text">
  See veebisait kasutab küpsiseid parema kasutuskogemuse pakkumiseks.
</div>

<div class="cookie-actions">
  <a href="privacy.html" class="cookie-btn cookie-btn-decline">
    Lisainfo
  </a>
  <button class="cookie-btn cookie-btn-accept">
    Nõustun
  </button>
</div>
</div>


<div class="topbar">
  <div class="topbar-inner">
    <a class="brand" href="index.html" aria-label="EUROPAGAR">
      <img src="images/logo.png" alt="EUROPAGAR logo" />
      <div>
        <div class="brand-name">EUROPAGAR</div>
        <div class="brand-sub">Elul on maitset</div>
      </div>
    </a>

    <nav class="nav" aria-label="Navigeerimine">
      <a href="index.html"><i class="fa fa-home"></i>Avaleht</a>
      <a href="index.html#company"><i class="fa fa-info-circle"></i>Ettevõttest</a>
      <a href="index.html#shop"><i class="fa fa-shopping-cart"></i>E-Pood</a>
      <a href="index.html#transport"><i class="fa fa-truck"></i>Transport</a>
      <a href="index.html#order"><i class="fa fa-clipboard"></i>Tellimus</a>
      <a href="index.html#contact"><i class="fa fa-envelope"></i>Kontakt</a>
    </nav>

    <div class="top-actions">
      <a class="icon-btn-1" href="https://www.facebook.com/people/Europagar/100063358998388/?ref=embed_page" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
        <i class="fab fa-facebook-f"></i>
      </a>
      
      <a class="icon-btn profile-btn" id="profileBtn" href="account.html" aria-label="Konto">
        <i class="fa-solid fa-user"></i>
      </a>

      <a class="cart-btn" href="cart.html" aria-label="Ostukorv">
        <i class="fa fa-shopping-cart"></i>
        <span class="cart-badge" id="cartBadge">0</span>
      </a>

      <a class="lang lang-et" href="reset-password.php" aria-label="Eesti"></a>
    </div>
    </div>
</div>

<main class="auth">
  <div class="wrap">
    <div class="card" data-block-key="reset-main">
      <div class="head">
        <div class="logo"><i class="fa-solid fa-key"></i></div>
        <div>
          <h1 data-field="title">Parooli taastamine</h1>
          <div class="hint"><span data-field="content_html" data-attr="html">Sisesta uus parool. Link kehtib 1 tund.</span></div>
        </div>
      </div>

      <div class="danger" id="errBox"></div>
      <div class="ok" id="okBox"></div>

      <div class="field">
        <label>Uus parool</label>
        <input id="p1" type="password" autocomplete="new-password" placeholder="Vähemalt 8 tähemärki">
      </div>

      <div class="field">
        <label>Korda uus parool</label>
        <input id="p2" type="password" autocomplete="new-password" placeholder="Korda parooli">
      </div>

      <div class="btns">
        <button class="btn btn-primary" id="submitBtn" type="button">
          <i class="fa-solid fa-rotate"></i> <span data-field="button_primary_label">Uuenda parool</span>
        </button>

        <a class="btn" href="checkout.html#login" data-href-field="button_secondary_url">
          <i class="fa-solid fa-right-to-bracket"></i> <span data-field="button_secondary_label">Logi sisse</span>
        </a>
      </div>

      <div class="small" data-block-key="reset-main-note" data-field="text">Kui sa ei küsinud parooli taastamist, lihtsalt sulge see leht.</div>

      <div class="tokenbox" id="tokenBox" hidden></div>
    </div>
  </div>

<div class="footer">
<div class="footer-inner">
  <div>© 2026 <strong>EUROPAGAR</strong></div>
  <div style="display:flex;gap:10px;align-items:center;">
    <a class="icon-btn-2" href="https://www.facebook.com/people/Europagar/100063358998388/?ref=embed_page" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
      <i class="fab fa-facebook-f"></i>
    </a>
    <a class="post" href="mailto:info@europagar.ee">info@europagar.ee</a>
  </div>
</div>
</div>

</main>


<script src="scripts/cookie.js" defer></script>
<script src="scripts/cart.js" defer></script>

  <script src="scripts/site-ui.js" defer></script>
  <script src="scripts/page-content.js" defer></script>
  <script src="scripts/reset-password-page.js" defer></script>
</body>
</html>
