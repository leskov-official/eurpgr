<?php
declare(strict_types=1);
require_once __DIR__ . '/db.php';

function ensure_site_content_schema(PDO $pdo): void {
  $pdo->exec("CREATE TABLE IF NOT EXISTS site_content_blocks (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    page_key VARCHAR(80) NOT NULL DEFAULT 'home',
    block_key VARCHAR(120) NOT NULL,
    block_type VARCHAR(40) NOT NULL DEFAULT 'section',
    name VARCHAR(255) NOT NULL DEFAULT '',
    eyebrow VARCHAR(255) NOT NULL DEFAULT '',
    title VARCHAR(255) NOT NULL DEFAULT '',
    content_html MEDIUMTEXT NULL,
    media_url VARCHAR(512) NOT NULL DEFAULT '',
    media_type VARCHAR(20) NOT NULL DEFAULT 'image',
    image_alt VARCHAR(255) NOT NULL DEFAULT '',
    button_primary_label VARCHAR(120) NOT NULL DEFAULT '',
    button_primary_url VARCHAR(512) NOT NULL DEFAULT '',
    button_secondary_label VARCHAR(120) NOT NULL DEFAULT '',
    button_secondary_url VARCHAR(512) NOT NULL DEFAULT '',
    sort INT NOT NULL DEFAULT 0,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_site_content_page_block (page_key, block_key),
    KEY idx_site_content_page_sort (page_key, sort, id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

  $dbName = (string)$pdo->query('SELECT DATABASE()')->fetchColumn();
  $st = $pdo->prepare('SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=? AND TABLE_NAME=? AND COLUMN_NAME=?');
  $st->execute([$dbName, 'site_content_blocks', 'page_key']);
  if ((int)$st->fetchColumn() === 0) {
    $pdo->exec("ALTER TABLE site_content_blocks ADD COLUMN page_key VARCHAR(80) NOT NULL DEFAULT 'home' AFTER id");
    $pdo->exec("UPDATE site_content_blocks SET page_key='home' WHERE page_key='' OR page_key IS NULL");
  }
  try { $pdo->exec("ALTER TABLE site_content_blocks ADD UNIQUE KEY uq_site_content_page_block (page_key, block_key)"); } catch (Throwable $e) {}
  try { $pdo->exec("ALTER TABLE site_content_blocks ADD KEY idx_site_content_page_sort (page_key, sort, id)"); } catch (Throwable $e) {}
}

function site_content_allowed_pages(): array {
  return ['home','checkout','cart','privacy','kuidas_tellida','notfound','reset_password','shop_category'];
}

function normalize_page_key(string $pageKey): string {
  $pageKey = trim(strtolower($pageKey));
  return in_array($pageKey, site_content_allowed_pages(), true) ? $pageKey : 'home';
}

function default_site_content_seed(): array {
  return [
    ['home','hero-slide-1','hero_slide','Avalehe slaid 1','','','','/images/image1.webp','image','Avalehe slaid 1','','','','',1,1],
    ['home','hero-slide-2','hero_slide','Avalehe slaid 2','','','','/images/image2.webp','image','Avalehe slaid 2','','','','',2,1],
    ['home','hero-slide-3','hero_slide','Avalehe slaid 3','','','','/images/image3.webp','image','Avalehe slaid 3','','','','',3,1],
    ['home','hero-slide-4','hero_slide','Avalehe slaid 4','','','','/images/image4.webp','image','Avalehe slaid 4','','','','',4,1],
    ['home','hero-main','section','Hero põhitekst','Parim valik','Avaleht','<p class="p">Europagar alustas oma tegevust 1993. aastal.</p>','','image','','E-Pood','#shop','Tee tellimus','#order',10,1],
    ['home','company','section','Ettevõttest','Ettevõttest','Ettevõttest','<p class="p">Meie tootevalik täieneb pidevalt.</p>','/images/image5.webp','image','Ettevõttest','Transport','#transport','','',20,1],
    ['home','shop-intro','section','E-poe sissejuhatus','E-pood','E-Pood','<p class="p">Lai valik igale maitsele.</p>','','image','','','','','',30,1],
    ['home','transport','section','Transport','Transport','Transport','<p class="p">Läbi e-poe tellitud kaubad saab kätte Tallinnas, Trummi 16B.</p>','/images/image6.webp','image','Transport','','','','',40,1],
    ['home','order','section','Tellimus','Tellimus','Tere tulemast, Europagar E-Poodi!','<p class="p">Europagari E-Poest saab tellida torte ja kringleid.</p>','/images/image7.webp','image','Tellimus','Kirjutada','mailto:info@europagar.ee','Täpsemalt','kuidas_tellida.html',50,1],
    ['home','contact','section','Kontakt','Kontakt','Kontakt','<p class="p">Trummi 16B, Tallinn 12617</p>','','image','','','','','',60,1],

    ['privacy','privacy-main','section','Privacy main','Privaatsus','Küpsised ja privaatsus','<p class="p">See leht selgitab, kuidas EUROPAGAR kasutab küpsiseid ja sarnaseid tehnoloogiaid, et parandada veebilehe toimimist ja kasutuskogemust.</p><h2 class="h" style="font-size:22px;">Mis on küpsised?</h2><p class="p">Küpsised on väikesed tekstifailid, mis salvestatakse sinu seadmesse, kui külastad veebilehte. Need aitavad näiteks meeles pidada eelistusi ning tagada lehe korrektse töö.</p><h2 class="h" style="font-size:22px;">Milliseid küpsiseid me kasutame?</h2><ul class="p" style="margin:0;padding-left:18px;line-height:1.6;"><li><strong>Vajalikud küpsised</strong> — lehe põhifunktsioonid (nt navigeerimine, turvalisus).</li><li><strong>Funktsionaalsed küpsised</strong> — eelistuste meeldejätmine (kui neid kasutatakse).</li><li><strong>Analüütika</strong> — anonüümne statistika, mis aitab lehte parendada (kui rakendatud).</li></ul><h2 class="h" style="font-size:22px;">Nõusolek ja haldamine</h2><p class="p">Sa saad küpsiste kasutamisega nõustuda küpsiste teavitusribal. Soovi korral saad küpsised kustutada või blokeerida oma brauseri seadetes. Arvesta, et küpsiste piiramine võib mõjutada veebilehe funktsionaalsust.</p><h2 class="h" style="font-size:22px;">Kontakt</h2><p class="p">Kui sul on küsimusi privaatsuse või küpsiste kohta, kirjuta: <a href="mailto:info@europagar.ee">info@europagar.ee</a></p>','','image','','','','','',10,1],

    ['kuidas_tellida','kuidas-main','section','Kuidas tellida','Tellimus','Tellimise tingimused','<h2 class="h" style="font-size:22px;">1. Kust tooted kätte saate:</h2><p class="p">Kõiki e-poest tellitavad tooted saab kätte Europagar OÜ kontorist aadressilt Trummi 16B, Tallinn 12617.</p><p class="p"><span class="text-oval">Tellitud kauba väljastamine toimub E – R: 08:00 – 16:00 ja L – P: Suletud</span></p><h2 class="h" style="font-size:22px;">Tellimine e-poe kaudu:</h2><ol class="p" style="padding-left:18px;line-height:1.7;"><li>Minge sobivasse tootekategooriasse või kasutage otsingut toodete leidmiseks. Valige toode, mida soovite osta.</li><li>Ostukorvis kontrollige, kas kõik teie soovitud tooted on nimekirjas. Vajutage lingile «Vormista tellimus».</li><li>Olge tellimuse vormistamisel tähelepanelik, sest meile edastatava info täpsusest sõltub tellimuse täitmine.</li><li>Makse sooritamiseks valige sobiv pangalink ja vajutage pärast makset nuppu <span class="text-oval">«TAGASI KAUPMEHE JUURDE».</span></li><li>Makseid võetakse vastu eurodes.</li></ol><p class="p">Olles teie tellimused kätte saanud, saadame kinnituse teie e-posti aadressile.</p><h2 class="h" style="font-size:22px;">Tellimuse täitmise tähtajad:</h2><p class="p">Kui soovite tooteid järgmiseks päevaks, siis peab tellimus olema tehtud enne kella 13:00. Eritellimustortidel on ettetellimisaeg 3 ööpäeva.</p><h2 class="h" style="font-size:22px;">Tellimuse maksumus:</h2><p class="p">Toodete maksumus on välja toodud ostukorvis. Maksmiseks tuleb sooritada ost e-poest ja maksta pangalingi kaudu.</p><h2 class="h" style="font-size:22px;">Tellimine telefoni teel:</h2><p class="p">Helistage tellimisnumbril <span class="text-oval">+372 6 522 366</span> (E-R 8:00 – 16:00).</p><h2 class="h" style="font-size:22px;">Tellimine e-maili teel:</h2><p class="p">Esitage oma tellimus aadressile <span class="text-oval">info@europagar.ee</span>.</p><h2 class="h" style="font-size:22px;">Tellimuse tühistamine:</h2><p class="p">Kliendil on õigus oma tellimus tühistada ja 5 tööpäeva jooksul raha tagasi saada.</p><h2 class="h" style="font-size:22px;">Turvalisus:</h2><p class="p">Kliendiinfo on rangelt konfidentsiaalne ja ei kuulu avalikustamiseks kolmandatele osapooltele.</p>','','image','','','','','',10,1],

    ['notfound','notfound-main','section','404 põhiblokk','Lehte ei leitud','404','<p class="lead">Vabandame — otsitud leht puudub või on teisele aadressile kolitud.</p><p class="sub">Kasuta allolevaid nuppe, et liikuda tagasi avalehele, e-poodi või võtta meiega ühendust.</p>','','image','','Avalehele','index.html','Kontakt','index.html#contact',10,1],

    ['cart','cart-main','section','Ostukorv pealkiri','','Ostukorv','<p class="p">Vaata üle lisatud tooted ja jätka tellimusega siis, kui kõik on õige.</p>','','image','','','','','',10,1],
    ['cart','cart-actions','section','Ostukorv nupud','','','','','image','','Tagasi','javascript:history.back()','Mine maksma','checkout.html',20,1],

    ['checkout','checkout-head','section','Checkout pealkiri','','Ostu vormistamine','<span>Avaleht</span><span>→</span><span>Ostukorv</span><span>→</span><strong>Mine maksma</strong>','','image','','','','','',10,1],
    ['checkout','checkout-login-notice','section','Checkout login notice','','','Oled juba klient? <a href="#login" id="openLogin">sisselogimiseks kliki siia</a>','','image','','','','','',20,1],
    ['checkout','checkout-login','section','Checkout login','Logi sisse','Logi sisse','<p class="hint">Kui oled meilt varem ostnud, siis sisesta oma andmed allolevatesse lahtritesse. Kui oled uus klient, siis palun liigu edasi arvelduse sektsiooni.</p>','','image','','Logi sisse','#login','Kaotasid parooli?','#forgot',30,1],
    ['checkout','checkout-billing','section','Checkout billing','Arveldamine ja transport','Arveldamine ja transport','<p class="hint">Sisesta arve- ja kontaktandmed, et saaksime tellimuse õigesti töödelda.</p>','','image','','','','','',40,1],
    ['checkout','checkout-notes','section','Checkout notes','Lisainfo','Lisainfo','<p class="hint">Lisa siia kättetoimetamise või tellimuse täpsustused.</p>','','image','','','','','',50,1],
    ['checkout','checkout-order-summary','section','Checkout summary','Sinu tellimus','Sinu tellimus','<p class="hint">Kontrolli enne maksmist tellimuse sisu ja kogusummat.</p>','','image','','Tagasi','cart.html','','',60,1],
    ['checkout','checkout-payment','section','Checkout payment','Makse','Makse','<p class="hint">Vali pank või makseviis. Pärast nupu vajutamist suunatakse sind makselehele.</p>','','image','','','','','',70,1],

    ['reset_password','reset-main','section','Reset password main','','Parooli taastamine','Sisesta uus parool. Link kehtib 1 tund.','','image','','Uuenda parool','#submit','Logi sisse','checkout.html#login',10,1],

    ['shop_category','shop-category-main','section','Shop category header','E-Pood','E-Pood','<p class="p">Tutvu valitud kategooria toodetega.</p>','','image','','Tagasi','index.html#shop','','',10,1],
  ];
}

function seed_site_content(PDO $pdo): void {
  ensure_site_content_schema($pdo);
  $seed = default_site_content_seed();
  $st = $pdo->prepare('INSERT INTO site_content_blocks (page_key, block_key, block_type, name, eyebrow, title, content_html, media_url, media_type, image_alt, button_primary_label, button_primary_url, button_secondary_label, button_secondary_url, sort, is_active) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE block_type=VALUES(block_type), name=IF(name="", VALUES(name), name), eyebrow=IF(eyebrow="", VALUES(eyebrow), eyebrow), title=IF(title="", VALUES(title), title), content_html=IF(content_html IS NULL OR content_html="", VALUES(content_html), content_html), media_url=IF(media_url="", VALUES(media_url), media_url), media_type=IF(media_type="", VALUES(media_type), media_type), image_alt=IF(image_alt="", VALUES(image_alt), image_alt), button_primary_label=IF(button_primary_label="", VALUES(button_primary_label), button_primary_label), button_primary_url=IF(button_primary_url="", VALUES(button_primary_url), button_primary_url), button_secondary_label=IF(button_secondary_label="", VALUES(button_secondary_label), button_secondary_label), button_secondary_url=IF(button_secondary_url="", VALUES(button_secondary_url), button_secondary_url), sort=VALUES(sort), is_active=VALUES(is_active)');
  foreach ($seed as $row) { $st->execute($row); }
}

function fetch_site_content(PDO $pdo, string $pageKey = 'home'): array {
  ensure_site_content_schema($pdo);
  seed_site_content($pdo);
  $pageKey = normalize_page_key($pageKey);
  $st = $pdo->prepare('SELECT * FROM site_content_blocks WHERE page_key=? ORDER BY sort ASC, id ASC');
  $st->execute([$pageKey]);
  $items = $st->fetchAll(PDO::FETCH_ASSOC) ?: [];
  $slides=[]; $blocks=[];
  foreach ($items as $item) {
    if ((int)($item['is_active'] ?? 1) !== 1) continue;
    if (($item['block_type'] ?? '') === 'hero_slide') $slides[] = $item; else $blocks[] = $item;
  }
  return ['page_key'=>$pageKey,'slides'=>$slides,'blocks'=>$blocks,'items'=>$items];
}
