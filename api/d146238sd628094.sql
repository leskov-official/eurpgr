-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Хост: d146238.mysql.teliaklm.ee
-- Время создания: Мар 14 2026 г., 00:32
-- Версия сервера: 11.4.9-MariaDB-log
-- Версия PHP: 8.2.29

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- База данных: `d146238sd628094`
--

-- --------------------------------------------------------

--
-- Структура таблицы `orders`
--

CREATE TABLE `orders` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `phone` varchar(50) NOT NULL,
  `email` varchar(190) NOT NULL,
  `notes` text DEFAULT NULL,
  `shipping_method` varchar(80) NOT NULL DEFAULT 'pickup',
  `shipping_text` varchar(255) DEFAULT NULL,
  `payment_method` varchar(80) NOT NULL,
  `total_cents` int(10) UNSIGNED NOT NULL,
  `currency` char(3) NOT NULL DEFAULT 'EUR',
  `status` varchar(30) NOT NULL DEFAULT 'new',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `payment_status` varchar(30) NOT NULL DEFAULT 'pending',
  `paid_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Структура таблицы `order_items`
--

CREATE TABLE `order_items` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `order_id` bigint(20) UNSIGNED NOT NULL,
  `product_id` varchar(80) DEFAULT NULL,
  `product_name` varchar(255) NOT NULL,
  `qty` int(10) UNSIGNED NOT NULL,
  `price_cents` int(10) UNSIGNED NOT NULL,
  `line_total_cents` int(10) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Структура таблицы `shop_categories`
--

CREATE TABLE `shop_categories` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `page_url` varchar(512) NOT NULL DEFAULT '',
  `image_url` varchar(512) NOT NULL DEFAULT '',
  `sort` int(11) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Дамп данных таблицы `shop_categories`
--

INSERT INTO `shop_categories` (`id`, `name`, `slug`, `page_url`, `image_url`, `sort`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Korvikesed', 'korvikesed', '/shop_category.html?slug=korvikesed', '/images/uploads/shop/20260312_123441_258d722a27f0.webp', 1, 1, '2026-03-10 21:06:41', '2026-03-12 10:34:42'),
(2, 'Soolased korvikesed', 'soolased-korvikesed', '/shop_category.html?slug=soolased-korvikesed', '/images/uploads/shop/20260312_123449_446c49da1615.webp', 2, 1, '2026-03-11 11:04:35', '2026-03-12 13:03:26'),
(3, 'Besee ja tordipõhjad', 'besee-ja-tordipohjad', '/shop_category.html?slug=besee-ja-tordipohjad', '/images/uploads/shop/20260312_122302_b2ebd87a6730.webp', 6, 1, '2026-03-11 15:09:33', '2026-03-12 10:23:02'),
(4, 'Taignad', 'taignad', '/shop_category.html?slug=taignad', '/images/uploads/shop/20260312_122239_ae337c392316.webp', 4, 1, '2026-03-11 21:12:19', '2026-03-12 13:03:21'),
(5, 'Kuklid', 'kuklid', '/shop_category.html?slug=kuklid', '/images/uploads/shop/20260312_122802_6c0c953ff7d2.png', 7, 1, '2026-03-11 21:21:38', '2026-03-12 10:28:03'),
(6, 'Mini pirukad', 'mini-pirukad', '/shop_category.html?slug=mini-pirukad', '/images/uploads/shop/20260312_122443_a4d1f6f934af.png', 3, 1, '2026-03-11 22:33:02', '2026-03-12 13:03:26'),
(7, 'Väikesaiad lehttaignast', 'vaikesaiad-lehttaignast', '/shop_category.html?slug=vaikesaiad-lehttaignast', '/images/uploads/shop/20260312_122529_67866d9f69bb.png', 5, 1, '2026-03-11 22:35:58', '2026-03-12 10:27:15'),
(8, 'Väikesaiad võiga lehttaignast', 'vaikesaiad-voiga-lehttaignast', '/shop_category.html?slug=vaikesaiad-voiga-lehttaignast', '/images/uploads/shop/20260312_123214_f1f255bd891d.png', 8, 1, '2026-03-11 22:57:04', '2026-03-12 10:32:16');

-- --------------------------------------------------------

--
-- Структура таблицы `shop_products`
--

CREATE TABLE `shop_products` (
  `id` int(10) UNSIGNED NOT NULL,
  `category_id` int(10) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `sku` varchar(128) NOT NULL DEFAULT '',
  `price_cents` int(11) NOT NULL DEFAULT 0,
  `pack_label` varchar(255) NOT NULL DEFAULT '',
  `image_url` varchar(512) NOT NULL DEFAULT '',
  `description` text DEFAULT NULL,
  `shelf_life_days` int(11) NOT NULL DEFAULT 0,
  `storage_temp` varchar(128) NOT NULL DEFAULT '',
  `ingredients` text DEFAULT NULL,
  `nutrition_per_100g` text DEFAULT NULL,
  `variants` longtext DEFAULT NULL,
  `ingredients_json` text DEFAULT NULL,
  `nutrition_json` text DEFAULT NULL,
  `variants_json` text DEFAULT NULL,
  `sort` int(11) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Дамп данных таблицы `shop_products`
--

INSERT INTO `shop_products` (`id`, `category_id`, `name`, `sku`, `price_cents`, `pack_label`, `image_url`, `description`, `shelf_life_days`, `storage_temp`, `ingredients`, `nutrition_per_100g`, `variants`, `ingredients_json`, `nutrition_json`, `variants_json`, `sort`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 1, 'MINI RUKKIJAHUKORVIKE', '4740507005042', 338, '16 tk, 90g', '/images/uploads/shop/20260312_123318_142d8d275f96.webp', 'Rukkijahust suupistekorvikesed.', 90, 'toatemperatuur', '[\"RUKKIJAHU\",\"Margariin (palmi- ja rapsiõli, vesi, emulgaator: E471, sool, happesuse regulaator sidrunhape, säilitusaine: E202, lõhnaaine, toiduvärv E160b(i))\",\"MUNAMASS\",\"Vesi\",\"Suhkur\",\"Sool\",\"Kergitusained: E450, E500\"]', '[\"Energiasisaldus 2144 kJ\\/513 kcal\",\"Rasvad 33,1g (millest küllastunud rasvhapped 15,7g)\",\"Süsivesikud 43g (millest suhkrud 3,1g)\",\"Valgud 5,8g\",\"Sool 1,8g\"]', '[]', '[\"RUKKIJAHU\",\"Margariin (palmi- ja rapsiõli, vesi, emulgaator: E471, sool, happesuse regulaator sidrunhape, säilitusaine: E202, lõhnaaine, toiduvärv E160b(i))\",\"MUNAMASS\",\"Vesi\",\"Suhkur\",\"Sool\",\"Kergitusained: E450, E500\"]', '[\"Energiasisaldus 2144 kJ\\/513 kcal\",\"Rasvad 33,1g (millest küllastunud rasvhapped 15,7g)\",\"Süsivesikud 43g (millest suhkrud 3,1g)\",\"Valgud 5,8g\",\"Sool 1,8g\"]', '[]', 1, 1, '2026-03-10 21:27:00', '2026-03-12 10:33:24'),
(3, 2, 'MINI MURETAIGNAKORVIKE', '4740507004663', 338, '(soolane) 16 tk, 90g', '/images/uploads/shop/20260312_123400_75508abc6efe.webp', 'Soolased muretaigna korvikesed suupistete valmistamiseks.', 90, 'toatemperatuur', '[\"NISUJAHU\",\"Margariin (palmi- ja rapsiõli, vesi, emulgaator: E471, sool, happesuse regulaator sidrunhape, säilitusaine: E202, lõhnaaine, toiduvärv E160b(i))\",\"MUNAMASS\",\"Vesi\",\"Suhkur\",\"Sool\",\"Kergitusaine: E450, E500\"]', '[\"Energiasisaldus 2208 kJ\\/528 kcal\",\"Rasvad 32,9g (millest küllastunud rasvhapped 15,4g)\",\"Süsivesikud 48,4g (millest suhkrud 3,1g)\",\"Valgud 8,8g\",\"Sool 1,7g\"]', '[]', '[\"NISUJAHU\",\"Margariin (palmi- ja rapsiõli, vesi, emulgaator: E471, sool, happesuse regulaator sidrunhape, säilitusaine: E202, lõhnaaine, toiduvärv E160b(i))\",\"MUNAMASS\",\"Vesi\",\"Suhkur\",\"Sool\",\"Kergitusaine: E450, E500\"]', '[\"Energiasisaldus 2208 kJ\\/528 kcal\",\"Rasvad 32,9g (millest küllastunud rasvhapped 15,4g)\",\"Süsivesikud 48,4g (millest suhkrud 3,1g)\",\"Valgud 8,8g\",\"Sool 1,7g\"]', '[]', 2, 1, '2026-03-11 11:07:29', '2026-03-12 10:34:01'),
(4, 3, 'PAVLOVA BESEE', '4740507007305', 342, '(2tk.karbis) 110g', '/images/uploads/shop/20260312_124148_8826a987a2ba.webp', 'Pavlova tüüpi besee, pitsilise äärega. Eeskätt mõeldud Pavlova tordi tegemiseks.', 60, 'toatemperatuur', '[\"Suhkur\",\"MUNAVALGE\",\"Kartulitärklis\"]', '[\"Energiasisaldus 1648kJ\\/394 kcal\",\"Rasvad 0g\",\"Süsivesikud 93,6g(millest suhkrud 89g)\",\"Valgud 5,3g\",\"Sool 0,1g\"]', '[]', '[\"Suhkur\",\"MUNAVALGE\",\"Kartulitärklis\"]', '[\"Energiasisaldus 1648kJ\\/394 kcal\",\"Rasvad 0g\",\"Süsivesikud 93,6g(millest suhkrud 89g)\",\"Valgud 5,3g\",\"Sool 0,1g\"]', '[]', 3, 1, '2026-03-11 15:11:06', '2026-03-12 10:41:55'),
(5, 3, 'PAVLOVA PESA', '4740507007626', 376, '(6tk.karbis) 150g', '/images/uploads/shop/20260312_124208_7f9d8b78e49d.webp', 'Pavlova besee pesad.', 90, 'toatemperatuur', '[\"Suhkur\",\"MUNAVALGE\",\"Kartulitärklis\"]', '[\"Energiasisaldus 1629kJ \\/ 390 kcal\",\"Rasvad 0g\",\"Süsivesikud 93,1g (millest suhkrud 92,9g)\",\"Valgud 4,8g\",\"Sool 0,2g\"]', '[]', '[\"Suhkur\",\"MUNAVALGE\",\"Kartulitärklis\"]', '[\"Energiasisaldus 1629kJ \\/ 390 kcal\",\"Rasvad 0g\",\"Süsivesikud 93,1g (millest suhkrud 92,9g)\",\"Valgud 4,8g\",\"Sool 0,2g\"]', '[]', 3, 1, '2026-03-11 15:15:22', '2026-03-12 10:42:11'),
(6, 3, 'BESEEPÕHJAD', '4740507006629', 259, '(3tk.karbis) väikesed 130g', '/images/uploads/shop/20260312_124233_3b185b40d874.webp', 'Beseepõhjad erinevad suurused – suured 2 tk  ja väikesed 3 tk.', 90, 'toatemperatuur', '[\"Suhkur\",\"MUNAVALGE\",\"Happesuse regulaator sidrunhape\",\"Maitseaine vaniliin\"]', '[\"Energiasisaldus 1629 kJ\\/390 kcal\",\"Rasvad 0,04g (millest küllastunud rasvhapped 0g)\",\"Süsivesikud 93,1g (millest suhkrud 92,9g)\",\"Valgud 4,8g\",\"Sool 0,17g\"]', '[{\"id\":\"(2tk.karbis) 240g\",\"sku\":\"4740507005233\",\"price\":3.66,\"pack\":{\"grams\":240,\"pieces\":2,\"label\":\"(2tk.karbis) 240g\"}},{\"id\":\"(3tk.karbis) väikesed 130g\",\"sku\":\"4740507006629\",\"price\":2.59,\"pack\":{\"grams\":130,\"pieces\":3,\"label\":\"(3tk.karbis) väikesed 130g\"}}]', '[\"Suhkur\",\"MUNAVALGE\",\"Happesuse regulaator sidrunhape\",\"Maitseaine vaniliin\"]', '[\"Energiasisaldus 1629 kJ\\/390 kcal\",\"Rasvad 0,04g (millest küllastunud rasvhapped 0g)\",\"Süsivesikud 93,1g (millest suhkrud 92,9g)\",\"Valgud 4,8g\",\"Sool 0,17g\"]', '[{\"id\":\"(2tk.karbis) 240g\",\"sku\":\"4740507005233\",\"price\":3.66,\"pack\":{\"grams\":240,\"pieces\":2,\"label\":\"(2tk.karbis) 240g\"}},{\"id\":\"(3tk.karbis) väikesed 130g\",\"sku\":\"4740507006629\",\"price\":2.59,\"pack\":{\"grams\":130,\"pieces\":3,\"label\":\"(3tk.karbis) väikesed 130g\"}}]', 3, 1, '2026-03-11 15:19:32', '2026-03-12 10:42:35'),
(7, 4, 'LIIVATAIGEN', '4740507003024', 368, '(magus) 700g', '/images/uploads/shop/20260312_123521_e858728b7575.webp', 'Magus liivataigen.', 30, '+2 ...+6', '[\"NISUJAHU\",\"Margariin (palmi- ja rapsiõli (osaliselt hüdrogeenitud), vesi, emulgaatorid: E471, E475, SOJALETSITIIN, sool, antioksüdant tokoferool, happesuse regulator sidrunhape, lõhna- ja maitseained, toiduvärv: E160a)\",\"Suhkur\",\"MUNAMASS\",\"Kergitusaine: E500\",\"Sool\"]', '[\"Energiasisaldus 1854 kJ\\/442 kcal\",\"Rasvad 23,8g (millest küllastunud rasvhapped 10g)\",\"Süsivesikud 50,2g (millest suhkrud 18,8g)\",\"Valgud 6,3g\",\"Sool 0,63g\"]', '[]', '[\"NISUJAHU\",\"Margariin (palmi- ja rapsiõli (osaliselt hüdrogeenitud), vesi, emulgaatorid: E471, E475, SOJALETSITIIN, sool, antioksüdant tokoferool, happesuse regulator sidrunhape, lõhna- ja maitseained, toiduvärv: E160a)\",\"Suhkur\",\"MUNAMASS\",\"Kergitusaine: E500\",\"Sool\"]', '[\"Energiasisaldus 1854 kJ\\/442 kcal\",\"Rasvad 23,8g (millest küllastunud rasvhapped 10g)\",\"Süsivesikud 50,2g (millest suhkrud 18,8g)\",\"Valgud 6,3g\",\"Sool 0,63g\"]', '[]', 4, 1, '2026-03-11 21:15:18', '2026-03-12 10:35:25'),
(8, 5, 'HAMBURGERI SAI SEEMNETEGA', '16s', 41, '75g', '/images/uploads/shop/20260312_124429_baff63ebb542.png', 'Klassikaline hamburgerisai seemnetega', 2, 'toatemperatuur', '[\"NISUJAHU\",\"Vesi\",\"Suhkur\",\"Margariin (palmi- ja rapsiõli, vesi, emulgaator: E471, happesuse regulaator sidrunhape, säilitusaine: E202, lõhna- ja maitseained, toiduvärv E160(i))\",\"Pärm\",\"Linaseemned\",\"SEESAMISEEMNED\",\"MUNAMASS\",\"Sool\"]', '[\"Energiasisaldus 1550 kJ\\/370 kcal\",\"Rasvad 10,4g (millest küllastunud rasvhapped 3,6g)\",\"Süsivesikud 56,7 (millest suhkrud 8,2g)\",\"Valgud 10,6g\",\"Sool 1,1g\"]', '[]', '[\"NISUJAHU\",\"Vesi\",\"Suhkur\",\"Margariin (palmi- ja rapsiõli, vesi, emulgaator: E471, happesuse regulaator sidrunhape, säilitusaine: E202, lõhna- ja maitseained, toiduvärv E160(i))\",\"Pärm\",\"Linaseemned\",\"SEESAMISEEMNED\",\"MUNAMASS\",\"Sool\"]', '[\"Energiasisaldus 1550 kJ\\/370 kcal\",\"Rasvad 10,4g (millest küllastunud rasvhapped 3,6g)\",\"Süsivesikud 56,7 (millest suhkrud 8,2g)\",\"Valgud 10,6g\",\"Sool 1,1g\"]', '[]', 5, 1, '2026-03-11 22:11:39', '2026-03-12 10:44:31'),
(9, 5, 'KLII HOT DOGI SAI', '56k', 45, '85g', '/images/uploads/shop/20260312_124401_4b96fe488d28.png', '', 2, 'toatemperatuur', '[]', '[]', '[]', '[]', '[]', '[]', 5, 1, '2026-03-11 22:21:14', '2026-03-12 10:44:03'),
(10, 5, 'HAMBURGERISAI', '16', 42, '90g', '/images/uploads/shop/20260312_124439_d11d9b874369.png', '', 2, 'toatemperatuur', '[]', '[]', '[]', '[]', '[]', '[]', 5, 1, '2026-03-11 22:23:12', '2026-03-12 10:44:56'),
(11, 6, 'SINGIAMPS', 'amps', 1844, '1kg', '/images/uploads/shop/20260312_123621_753913ee7046.png', 'Pärmi-lehttaignast minipirukad mis täidetud singitäidisega ja peal riivjuust.', 2, '+2 ...+6', '[\"NISUJAHU\",\"Sink 27% (sealiha, vesi, tärklis, dekstroos, sool, SOJAVALK, sealihavalk, taimsed kiud(kartuli- ja tsitrusekiud), stabilisaatorid: E407, E425, E450, E1422, lõhna- ja maitseained, happesuse regulator sidrunhape, antioksüdant E300, vürtsid, pärmiekstrakt, säilitusaine E250)\",\"Vesi\",\"Margariin (palmi- ja rapsiõli (osaliselt hüdrogeenitud), vesi, emulgaatorid: E47, E475, SOJALETSITIIN, sool, antioksüdant tokoferool, happesuse regulator sidrunhape, lõhna- ja maitseained,  toiduvärv E160a)\",\"JUUST 9%\",\"MUNAMASS\",\"Pärm\",\"Suhkur\",\"Modifitseeritud maisitärklis\",\"Sool\",\"Jahuparandaja (NISUJAHU, antioksüdant E300)\"]', '[\"Energiasisaldus 1237 kJ\\/295 kcal\",\"Rasvad 15,8g (millest küllastunud rasvhapped 6,4g)\",\"Süsivesikud 25,5g (millest suhkrud 5,3g)\",\"Valgud 12,2g\",\"Sool 1,4g\"]', '[]', '[\"NISUJAHU\",\"Sink 27% (sealiha, vesi, tärklis, dekstroos, sool, SOJAVALK, sealihavalk, taimsed kiud(kartuli- ja tsitrusekiud), stabilisaatorid: E407, E425, E450, E1422, lõhna- ja maitseained, happesuse regulator sidrunhape, antioksüdant E300, vürtsid, pärmiekstrakt, säilitusaine E250)\",\"Vesi\",\"Margariin (palmi- ja rapsiõli (osaliselt hüdrogeenitud), vesi, emulgaatorid: E47, E475, SOJALETSITIIN, sool, antioksüdant tokoferool, happesuse regulator sidrunhape, lõhna- ja maitseained,  toiduvärv E160a)\",\"JUUST 9%\",\"MUNAMASS\",\"Pärm\",\"Suhkur\",\"Modifitseeritud maisitärklis\",\"Sool\",\"Jahuparandaja (NISUJAHU, antioksüdant E300)\"]', '[\"Energiasisaldus 1237 kJ\\/295 kcal\",\"Rasvad 15,8g (millest küllastunud rasvhapped 6,4g)\",\"Süsivesikud 25,5g (millest suhkrud 5,3g)\",\"Valgud 12,2g\",\"Sool 1,4g\"]', '[]', 6, 1, '2026-03-11 22:34:51', '2026-03-12 10:36:24'),
(12, 7, 'ÕUNARUUT', '4740507003499', 154, '(2tk. kotis) 130g', '/images/uploads/shop/20260312_123722_216de15faece.png', 'Pärmi-lehttaignapirukas õunakuubiku-moosiga, peal valge glasuuri kaunistus.', 2, 'toatemperatuur', '[\"NISUJAHU\",\"vesi\",\"margariin (taimsed õlid ja rasvad (raps ja palm – osaliselt hüdrogeenitud), emulgaatorid: E471, E475, letsitiinid, sool, antioksüdant E306, happesuse regulaator sidrunhape, lõhna- ja maitseaine, toiduvõrv karoteen)\",\"valge glasuur (suhkur, täielikult ja osaliselt hüdrogeenitud palmituumarasv, magus VADAKUPULBER, LÕSSIPULBER, emulgaator letsitiinid, lõhna- ja maitseained)\",\"õunapirukamoos 28% (õunad 88%, suhkur, modifitseeritud tärklis, sidrunhape, kaaliumsorbaat, lõhna- ja maitseaine)\",\"MUNAMASS\",\"Suhkur\",\"Pärm\",\"Sool\",\"Jahuparandaja (NISUJAHU, emulgaator E481, jahuparandaja E300)\"]', '[\"Energiasisaldus 1462 kJ\\/349 kcal\",\"Rasvad 17,3g (millest küllastunud rasvhapped 8,9g)\",\"Süsivesikud 42,6g (millest suhkrud 11,1g)\",\"Valgud 6,1g\",\"Sool 0,8g\"]', '[]', '[\"NISUJAHU\",\"vesi\",\"margariin (taimsed õlid ja rasvad (raps ja palm – osaliselt hüdrogeenitud), emulgaatorid: E471, E475, letsitiinid, sool, antioksüdant E306, happesuse regulaator sidrunhape, lõhna- ja maitseaine, toiduvõrv karoteen)\",\"valge glasuur (suhkur, täielikult ja osaliselt hüdrogeenitud palmituumarasv, magus VADAKUPULBER, LÕSSIPULBER, emulgaator letsitiinid, lõhna- ja maitseained)\",\"õunapirukamoos 28% (õunad 88%, suhkur, modifitseeritud tärklis, sidrunhape, kaaliumsorbaat, lõhna- ja maitseaine)\",\"MUNAMASS\",\"Suhkur\",\"Pärm\",\"Sool\",\"Jahuparandaja (NISUJAHU, emulgaator E481, jahuparandaja E300)\"]', '[\"Energiasisaldus 1462 kJ\\/349 kcal\",\"Rasvad 17,3g (millest küllastunud rasvhapped 8,9g)\",\"Süsivesikud 42,6g (millest suhkrud 11,1g)\",\"Valgud 6,1g\",\"Sool 0,8g\"]', '[]', 7, 1, '2026-03-11 22:40:14', '2026-03-12 10:37:24'),
(13, 7, 'VANILJESAI', '4740507003123', 172, '(2tk. kotis) 160g', '/images/uploads/shop/20260312_123834_7d816c64b048.png', 'Pärmi-lehttaignasaiake vaniljekreemiga, peal tuhksuhkur.', 2, 'toatemperatuur', '[\"NISUJAHU\",\"Keedukreem 24% (vesi, suhkur, dekstroos, modifitseeritud maisitärklis, VADAKUPULBER, palmi- ja kookosõli, PIIMAPULBER, paksendajad: E407, E461, E412, toiduvärv E160a, lõhna- ja maitseained)\",\"Vesi\",\"Margariin (palmi- ja rapsiõli (osaliselt hüdrogeenitud), vesi, emulgaatorid: E47, E475, SOJALETSITIIN, sool, antioksüdant tokoferool, happesuse regulator sidrunhape, lõhna- ja maitseained,  toiduvärv E160a)\",\"Suhkur\",\"MUNAMASS\",\"Pärm\",\"Sool\",\"Jahuparandaja (NISUJAHU, antioksüdant E300)\"]', '[\"Energiasisaldus 1489 kJ\\/355 kcal\",\"Rasvad 15g (millest küllastunud rasvhapped 6,4g)\",\"Süsivesikud 48,3g (millest suhkrud 18,3g)\",\"Valgud 6,1g\",\"Sool 0,8g\"]', '[]', '[\"NISUJAHU\",\"Keedukreem 24% (vesi, suhkur, dekstroos, modifitseeritud maisitärklis, VADAKUPULBER, palmi- ja kookosõli, PIIMAPULBER, paksendajad: E407, E461, E412, toiduvärv E160a, lõhna- ja maitseained)\",\"Vesi\",\"Margariin (palmi- ja rapsiõli (osaliselt hüdrogeenitud), vesi, emulgaatorid: E47, E475, SOJALETSITIIN, sool, antioksüdant tokoferool, happesuse regulator sidrunhape, lõhna- ja maitseained,  toiduvärv E160a)\",\"Suhkur\",\"MUNAMASS\",\"Pärm\",\"Sool\",\"Jahuparandaja (NISUJAHU, antioksüdant E300)\"]', '[\"Energiasisaldus 1489 kJ\\/355 kcal\",\"Rasvad 15g (millest küllastunud rasvhapped 6,4g)\",\"Süsivesikud 48,3g (millest suhkrud 18,3g)\",\"Valgud 6,1g\",\"Sool 0,8g\"]', '[]', 7, 1, '2026-03-11 22:43:24', '2026-03-12 10:38:38'),
(14, 7, 'VAARIKALOOTSIK', '4740507004328', 203, '(2tk. kotis) 180g', '/images/uploads/shop/20260312_123813_bd73451e2cd9.png', 'Pärmi-lehttaignasaiake vaarikamoosi ja vaniljekreemiga, peal streisel.', 30, '-18*C', '[\"NISUJAHU\",\"Vaarikamoos (vaarikad 13%, modifitseeritud maisitärklis, paksendaja E440, happesuse regulaatorid: E330, E333, säilitusaine E202, lõhna- ja maitseained, toiduvärv E120)\",\"Keedukreem (vesi, suhkur, dekstroos, modifitseeritud maisitärklis, VADAKUPULBER, palmi- ja kookosõli, PIIMAPULBER, paksendajad: E407, E461, E412, toiduvärv E160a, lõhna- ja maitseained)\",\"Vesi\",\"Margariin (palmi- ja rapsiõli (osaliselt hüdrogeenitud), vesi, emulgaatorid: E47, E475, SOJALETSITIIN, sool, antioksüdant tokoferool, happesuse regulator sidrunhape, lõhna- ja maitseained,  toiduvärv E160a)\",\"MUNAMASS\",\"Suhkur\",\"Pärm\",\"Sool\",\"Jahuparandaja (NISUJAHU, antioksüdant E300)\"]', '[\"Energiasisaldus 1370 kJ\\/327 kcal\",\"Rasvad 14,4g (millest küllastunud rasvhapped 6,1g)\",\"Süsivesikud 42,6g (millest suhkrud 14g)\",\"Valgud 5,7g\",\"Sool 0,7g\"]', '[]', '[\"NISUJAHU\",\"Vaarikamoos (vaarikad 13%, modifitseeritud maisitärklis, paksendaja E440, happesuse regulaatorid: E330, E333, säilitusaine E202, lõhna- ja maitseained, toiduvärv E120)\",\"Keedukreem (vesi, suhkur, dekstroos, modifitseeritud maisitärklis, VADAKUPULBER, palmi- ja kookosõli, PIIMAPULBER, paksendajad: E407, E461, E412, toiduvärv E160a, lõhna- ja maitseained)\",\"Vesi\",\"Margariin (palmi- ja rapsiõli (osaliselt hüdrogeenitud), vesi, emulgaatorid: E47, E475, SOJALETSITIIN, sool, antioksüdant tokoferool, happesuse regulator sidrunhape, lõhna- ja maitseained,  toiduvärv E160a)\",\"MUNAMASS\",\"Suhkur\",\"Pärm\",\"Sool\",\"Jahuparandaja (NISUJAHU, antioksüdant E300)\"]', '[\"Energiasisaldus 1370 kJ\\/327 kcal\",\"Rasvad 14,4g (millest küllastunud rasvhapped 6,1g)\",\"Süsivesikud 42,6g (millest suhkrud 14g)\",\"Valgud 5,7g\",\"Sool 0,7g\"]', '[]', 7, 1, '2026-03-11 22:45:43', '2026-03-12 10:38:17'),
(15, 7, 'SUHKRUKRINGEL', '4740507004205', 128, '(2tk. kotis) 100g', '/images/uploads/shop/20260312_123921_66a1de56f700.png', 'Pärmi-lehttaignast kringlikujuline saiake mis kaetud pealt pärlsuhkruga.', 2, 'toatemperatuur', '[\"NISUJAHU\",\"Suhkur 33%\",\"Vesi\",\"Margariin (palmi- ja rapsiõli (osaliselt hüdrogeenitud), vesi, emulgaatorid: E47, E475, SOJALETSITIIN, sool, antioksüdant tokoferool, happesuse regulator sidrunhape, lõhna- ja maitseained,  toiduvärv E160a)\",\"MUNAMASS\",\"Pärm\",\"Sool\",\"Jahuparandaja (NISUJAHU, antioksüdant E300)\"]', '[\"Energiasisaldus 1818 kJ\\/434 kcal\",\"Rasvad 17,9g (millest küllastunud rasvhapped 7,4g)\",\"Süsivesikud 60g (millest suhkrud 24,3g)\",\"Valgud 7,5g\",\"Sool 0,1g\"]', '[]', '[\"NISUJAHU\",\"Suhkur 33%\",\"Vesi\",\"Margariin (palmi- ja rapsiõli (osaliselt hüdrogeenitud), vesi, emulgaatorid: E47, E475, SOJALETSITIIN, sool, antioksüdant tokoferool, happesuse regulator sidrunhape, lõhna- ja maitseained,  toiduvärv E160a)\",\"MUNAMASS\",\"Pärm\",\"Sool\",\"Jahuparandaja (NISUJAHU, antioksüdant E300)\"]', '[\"Energiasisaldus 1818 kJ\\/434 kcal\",\"Rasvad 17,9g (millest küllastunud rasvhapped 7,4g)\",\"Süsivesikud 60g (millest suhkrud 24,3g)\",\"Valgud 7,5g\",\"Sool 0,1g\"]', '[]', 7, 1, '2026-03-11 22:47:37', '2026-03-12 10:39:23'),
(16, 7, 'KREEMITASKU', '4740507003314', 123, '(2tk. kotis) 100g', '/images/uploads/shop/20260312_123940_3021cc2da8a8.png', 'Pärmi-lehttaignasaiake vaniljekreemiga, peal tuhksuhkur.', 2, 'toatemperatuur', '[\"NISUJAHU\",\"Keedukreem (vesi, suhkur, dekstroos, modifitseeritud maisitärklis, VADAKUPULBER, palmi- ja kookosõli, PIIMAPULBER, paksendajad: E407, E461, E412, toiduvärv E160a, lõhna- ja maitseained)\",\"Vesi\",\"Margariin (palmi- ja rapsiõli (osaliselt hüdrogeenitud), vesi, emulgaatorid: E47, E475, SOJALETSITIIN, sool, antioksüdant tokoferool, happesuse regulator sidrunhape, lõhna- ja maitseained,  toiduvärv E160a)\",\"Suhkur\",\"MUNAMASS\",\"Pärm\",\"Sool\",\"Jahuparandaja (NISUJAHU, antioksüdant E300)\"]', '[\"Energiasisaldus 1525 kJ\\/364 kcal\",\"Rasvad 16,3g (millest küllastunud rasvhapped 6,9g)\",\"Süsivesikud 47,1g (millest suhkrud 14,7g)\",\"Valgud 6,6g\",\"Sool 0,9g\"]', '[]', '[\"NISUJAHU\",\"Keedukreem (vesi, suhkur, dekstroos, modifitseeritud maisitärklis, VADAKUPULBER, palmi- ja kookosõli, PIIMAPULBER, paksendajad: E407, E461, E412, toiduvärv E160a, lõhna- ja maitseained)\",\"Vesi\",\"Margariin (palmi- ja rapsiõli (osaliselt hüdrogeenitud), vesi, emulgaatorid: E47, E475, SOJALETSITIIN, sool, antioksüdant tokoferool, happesuse regulator sidrunhape, lõhna- ja maitseained,  toiduvärv E160a)\",\"Suhkur\",\"MUNAMASS\",\"Pärm\",\"Sool\",\"Jahuparandaja (NISUJAHU, antioksüdant E300)\"]', '[\"Energiasisaldus 1525 kJ\\/364 kcal\",\"Rasvad 16,3g (millest küllastunud rasvhapped 6,9g)\",\"Süsivesikud 47,1g (millest suhkrud 14,7g)\",\"Valgud 6,6g\",\"Sool 0,9g\"]', '[]', 7, 1, '2026-03-11 22:50:36', '2026-03-12 10:39:50'),
(17, 7, 'KIRSISAI', '4740507003482', 172, '(2tk. kotis) 140g', '/images/uploads/shop/20260312_124014_5516fc4a46cf.png', 'Pärmi-lehttaignasaiake kirsimoosiga.', 1, 'toatemperatuur', '[\"NISUJAHU\",\"Kirsimoos 22% (kirsid(VÕIB SISALDADA KIRSIKIVE – ETTEVAATUS), suhkur, modifitseeritud maisitärklis, happesuse regulator sidrunhape, kirsi lõhna- ja maitseaine, säilitusaine E202)\",\"Vesi\",\"Margariin (palmi- ja rapsiõli (osaliselt hüdrogeenitud), vesi, emulgaatorid: E47, E475, SOJALETSITIIN, sool, antioksüdant tokoferool, happesuse regulator sidrunhape, lõhna- ja maitseained,  toiduvärv E160a)\",\"Valge glasuur (suhkur, täielikult hüdrogeenitud palmituuma rasv, LÕSSIPULBER, LAKTOOS, emulgaator: päevalille letsitiin, vaniliin)\",\"MUNAMASS\",\"Suhkur\",\"Pärm\",\"Želeepulber (suhkur, happesuse regulaatorid: E330, E331, E340, želeerivad ained: karrageen, pektiin, dekstroos, karamell, lõhna- ja maitseained)\",\"Sool\",\"Jahuparandaja (NISUJAHU, antioksüdant E300)\"]', '[\"Energiasisaldus 1439 kJ\\/343 kcal\",\"Rasvad 15,3g (millest küllastunud rasvhapped 7,8g)\",\"Süsivesikud 44,9g (millest suhkrud 18,2g)\",\"Valgud 5,7g\",\"Sool 0,9g\"]', '[]', '[\"NISUJAHU\",\"Kirsimoos 22% (kirsid(VÕIB SISALDADA KIRSIKIVE – ETTEVAATUS), suhkur, modifitseeritud maisitärklis, happesuse regulator sidrunhape, kirsi lõhna- ja maitseaine, säilitusaine E202)\",\"Vesi\",\"Margariin (palmi- ja rapsiõli (osaliselt hüdrogeenitud), vesi, emulgaatorid: E47, E475, SOJALETSITIIN, sool, antioksüdant tokoferool, happesuse regulator sidrunhape, lõhna- ja maitseained,  toiduvärv E160a)\",\"Valge glasuur (suhkur, täielikult hüdrogeenitud palmituuma rasv, LÕSSIPULBER, LAKTOOS, emulgaator: päevalille letsitiin, vaniliin)\",\"MUNAMASS\",\"Suhkur\",\"Pärm\",\"Želeepulber (suhkur, happesuse regulaatorid: E330, E331, E340, želeerivad ained: karrageen, pektiin, dekstroos, karamell, lõhna- ja maitseained)\",\"Sool\",\"Jahuparandaja (NISUJAHU, antioksüdant E300)\"]', '[\"Energiasisaldus 1439 kJ\\/343 kcal\",\"Rasvad 15,3g (millest küllastunud rasvhapped 7,8g)\",\"Süsivesikud 44,9g (millest suhkrud 18,2g)\",\"Valgud 5,7g\",\"Sool 0,9g\"]', '[]', 7, 1, '2026-03-11 22:53:56', '2026-03-12 10:40:19'),
(18, 8, 'KODUJUUSTUPIRUKAS', '4740507000962', 165, '(2tk. kilekotis) 150g', '/images/uploads/shop/20260312_124638_1c704199471b.png', 'Kihistatud võitaignast pirukas kodujuustutäidisega.', 3, 'toatemperatuur', '[\"NISUJAHU\",\"KOHUPIIM\",\"KODUJUUST 14%\",\"JUUST\",\"margariin (taimsed õlid – palm ja raps, vesi, emulgaatorid: E322, E471, sool, lõhna- ja maitseained, antioksüdantid: E306, E304i, säilitusaine E202, happesuse regulaator sidrunhape, toiduvärv E160a, kääritatud NISUJAHU)\",\"MUNAMASS\",\"vesi\",\"VÕI\",\"suhkur\",\"pärm\",\"SEESAM\",\"modifitseeritud tärklis\",\"sool\",\"jahuparandaja (NISUJAHU, emulgaator E481, jahuparandaja E300)\",\"till\"]', '[\"energiasisaldus 1461 kJ\\/350 kcal\",\"rasvad 21,3g (millest küllastunud rasvhapped 9,86g)\",\"süsivesikud 25,6g (millest suhkrud 4,15g)\",\"valgud 15,3g\",\"sool 1,01g\"]', '[]', '[\"NISUJAHU\",\"KOHUPIIM\",\"KODUJUUST 14%\",\"JUUST\",\"margariin (taimsed õlid – palm ja raps, vesi, emulgaatorid: E322, E471, sool, lõhna- ja maitseained, antioksüdantid: E306, E304i, säilitusaine E202, happesuse regulaator sidrunhape, toiduvärv E160a, kääritatud NISUJAHU)\",\"MUNAMASS\",\"vesi\",\"VÕI\",\"suhkur\",\"pärm\",\"SEESAM\",\"modifitseeritud tärklis\",\"sool\",\"jahuparandaja (NISUJAHU, emulgaator E481, jahuparandaja E300)\",\"till\"]', '[\"energiasisaldus 1461 kJ\\/350 kcal\",\"rasvad 21,3g (millest küllastunud rasvhapped 9,86g)\",\"süsivesikud 25,6g (millest suhkrud 4,15g)\",\"valgud 15,3g\",\"sool 1,01g\"]', '[]', 8, 1, '2026-03-11 23:02:08', '2026-03-12 10:48:01'),
(19, 8, 'KOHUPIIMA – MOONISAIAKE', '4740507007473', 168, '(2tk. kotis) 130g', '/images/uploads/shop/20260312_124559_8d57064471fb.png', 'Võiga pärmi-lehttaignast valmistatud saiake. Täidiseks kohupiima-hapukooresegu koos mooniseemnetega. Pealt kaunistatud valge glasuuriga.', 2, 'toatemperatuur', '[\"NISUJAHU\",\"margariin (taimsed õlid – palm ja raps, vesi, emulgaatorid: päevalilleletsitiin, E471, sool, lõhna- ja maitseained, antioksüdandid: E306, E304i, säilitusaine E202,  happesuse regulator sidrunhape, toiduvärv E160a, kääritatud NISUJAHU)\",\"KOHUPIIM 11%\",\"VÕI\",\"vesi\",\"valge glasuur (suhkur, täielikult ja osaliselt hüdrogeenitud taimne palmituumarasv, magus VADAKUPULBER, LÕSSIPULBER, emulgaator letsitiinid, lõhna- ja maitseained)\",\"suhkur\",\"MUNAMASS\",\"HAPUKOOR\",\"MUNAKOLLASEMASS\",\"pärm\",\"vaniljekreemipulber (suhkur, modifitseeritud tärklis, dekstroos, VADAKUPULBER, palmiõli, stabilisaator E170, paksendaja E170, lõhna- ja maitseained, sool, toiduvärvid: E101, E160a)\",\"mooniseemned 0,6%\",\"sool\",\"modifitseeritud maisitärklis\",\"jahuparandaja (NISUJAHU, emulgaator E481, jahuparandaja E300)\",\"vaniljesuhkur\"]', '[\"Energiasisaldus 1836 kJ\\/438 kcal\",\"Rasvad 26g (millest küllastunud rasvhapped 13,4g)\",\"Süsivesikud 41,6g (millest suhkrud 13,9g)\",\"Valgud 8,9g\",\"Sool 0,8g\"]', '[]', '[\"NISUJAHU\",\"margariin (taimsed õlid – palm ja raps, vesi, emulgaatorid: päevalilleletsitiin, E471, sool, lõhna- ja maitseained, antioksüdandid: E306, E304i, säilitusaine E202,  happesuse regulator sidrunhape, toiduvärv E160a, kääritatud NISUJAHU)\",\"KOHUPIIM 11%\",\"VÕI\",\"vesi\",\"valge glasuur (suhkur, täielikult ja osaliselt hüdrogeenitud taimne palmituumarasv, magus VADAKUPULBER, LÕSSIPULBER, emulgaator letsitiinid, lõhna- ja maitseained)\",\"suhkur\",\"MUNAMASS\",\"HAPUKOOR\",\"MUNAKOLLASEMASS\",\"pärm\",\"vaniljekreemipulber (suhkur, modifitseeritud tärklis, dekstroos, VADAKUPULBER, palmiõli, stabilisaator E170, paksendaja E170, lõhna- ja maitseained, sool, toiduvärvid: E101, E160a)\",\"mooniseemned 0,6%\",\"sool\",\"modifitseeritud maisitärklis\",\"jahuparandaja (NISUJAHU, emulgaator E481, jahuparandaja E300)\",\"vaniljesuhkur\"]', '[\"Energiasisaldus 1836 kJ\\/438 kcal\",\"Rasvad 26g (millest küllastunud rasvhapped 13,4g)\",\"Süsivesikud 41,6g (millest suhkrud 13,9g)\",\"Valgud 8,9g\",\"Sool 0,8g\"]', '[]', 8, 1, '2026-03-11 23:05:27', '2026-03-12 10:46:01');

-- --------------------------------------------------------

--
-- Структура таблицы `site_content_blocks`
--

CREATE TABLE `site_content_blocks` (
  `id` int(10) UNSIGNED NOT NULL,
  `page_key` varchar(80) NOT NULL DEFAULT 'home',
  `block_key` varchar(120) NOT NULL,
  `block_type` varchar(40) NOT NULL DEFAULT 'section',
  `name` varchar(255) NOT NULL DEFAULT '',
  `eyebrow` varchar(255) NOT NULL DEFAULT '',
  `title` varchar(255) NOT NULL DEFAULT '',
  `content_html` mediumtext DEFAULT NULL,
  `media_url` varchar(512) NOT NULL DEFAULT '',
  `media_type` varchar(20) NOT NULL DEFAULT 'image',
  `image_alt` varchar(255) NOT NULL DEFAULT '',
  `button_primary_label` varchar(120) NOT NULL DEFAULT '',
  `button_primary_url` varchar(512) NOT NULL DEFAULT '',
  `button_secondary_label` varchar(120) NOT NULL DEFAULT '',
  `button_secondary_url` varchar(512) NOT NULL DEFAULT '',
  `sort` int(11) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Дамп данных таблицы `site_content_blocks`
--

INSERT INTO `site_content_blocks` (`id`, `page_key`, `block_key`, `block_type`, `name`, `eyebrow`, `title`, `content_html`, `media_url`, `media_type`, `image_alt`, `button_primary_label`, `button_primary_url`, `button_secondary_label`, `button_secondary_url`, `sort`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'home', 'hero-slide-1', 'hero_slide', 'Avalehe slaid 1', '', '', '', '/images/uploads/shop/20260313_214705_3a2053c2048b.png', 'image', 'Avalehe slaid 1', '', '', '', '', 1, 1, '2026-03-13 07:52:10', '2026-03-13 19:47:07'),
(2, 'home', 'hero-slide-2', 'hero_slide', 'Avalehe slaid 2', '', '', '', '/images/uploads/shop/20260313_214724_abd1b18b1fb6.png', 'image', 'Avalehe slaid 2', '', '', '', '', 2, 1, '2026-03-13 07:52:10', '2026-03-13 19:47:25'),
(3, 'home', 'hero-slide-3', 'hero_slide', 'Avalehe slaid 3', '', '', '', '/images/uploads/shop/20260313_214733_991f927a1369.png', 'image', 'Avalehe slaid 3', '', '', '', '', 3, 1, '2026-03-13 07:52:10', '2026-03-13 19:47:34'),
(4, 'home', 'hero-slide-4', 'hero_slide', 'Avalehe slaid 4', '', '', '', '/images/uploads/shop/20260313_214741_70167e347cb9.png', 'image', 'Avalehe slaid 4', '', '', '', '', 4, 1, '2026-03-13 07:52:10', '2026-03-13 19:47:42'),
(5, 'home', 'hero-main', 'section', 'Hero põhitekst', 'Parim valik', 'Avaleht', '<p class=\"p\">Europagar alustas oma tegevust 1993. aastal. 1997. aastal avasime Tallinnas, Trummi tn 16B, kaasaegse tootmishoone, kus valmivad käsitööna meie pagari- ja kondiitritooted. Ühendame traditsioonid, kvaliteetse tooraine ja tänapäevased töövõtted, et pakkuda klientidele alati värsket ja usaldusväärset maitset.</p>', '', 'image', '', 'E-Pood', '#shop', 'Tee tellimus', '#order', 10, 1, '2026-03-13 07:52:10', '2026-03-13 07:55:18'),
(6, 'home', 'company', 'section', 'Ettevõttest', 'Ettevõttest', 'Ettevõttest', '<p class=\"p\">Meie tootevalik täieneb pidevalt ning tänaseks valmistame juba üle 240 erineva nimetuse. Lisaks igapäevastele lemmikutele valmistame eritellimusel torte sünnipäevadeks ja tähtpäevadeks ning pakume laias valikus maitsvaid kringleid igaks sündmuseks.</p>', '/images/image5.webp', 'image', 'Ettevõttest', 'Transport', '#transport', '', '', 20, 1, '2026-03-13 07:52:10', '2026-03-13 07:55:37'),
(7, 'home', 'shop-intro', 'section', 'E-poe sissejuhatus', 'E-pood', 'E-Pood', '<p class=\"p\">Lai valik igale maitsele.</p>', '', 'image', '', '', '', '', '', 30, 1, '2026-03-13 07:52:10', '2026-03-13 07:52:10'),
(8, 'home', 'transport', 'section', 'Transport', 'Transport', 'Transport', '<p class=\"p\">Läbi e-poe tellitud kaubad saab kätte Tallinnas, Trummi 16B.</p>', '/images/image6.webp', 'image', 'Transport', '', '', '', '', 40, 1, '2026-03-13 07:52:10', '2026-03-13 07:52:10'),
(9, 'home', 'order', 'section', 'Tellimus', 'Tellimus', 'Tere tulemast, Europagar E-Poodi!', '<p class=\"p\">Europagari E-Poest saab tellida torte ja kringleid ning teisi pagari- ja kondiitritooteid. Toodete pildid on illustreerivad ning eritellimustortidele rakenduvad erinevad müügitingimused. Tellimusi on võimalikud ka e-posti teel või telefoni kaudu.</p>', '/images/image7.webp', 'image', 'Tellimus', 'Kirjutada', 'mailto:info@europagar.ee', 'Täpsemalt', 'kuidas_tellida.html', 50, 1, '2026-03-13 07:52:10', '2026-03-13 07:56:51'),
(10, 'home', 'contact', 'section', 'Kontakt', 'Kontakt', 'Kontakt', '<div class=\"p\">\n  <p><i class=\"fa fa-clock\"></i> <strong>Kontor avatud:</strong> E–R: 08:00–16:00 | L–P: Suletud</p>\n  <p><i class=\"fa fa-map-marker\"></i> <strong>Aadress:</strong> Trummi 16B, Tallinn 12617</p>\n  <p><i class=\"fa fa-phone\"></i> <strong>Üldkontakt:</strong> <a href=\"tel:+3726522366\" style=\"color:#d71920; text-decoration:none;\">+372 6 522 366</a> | <a href=\"mailto:info@europagar.ee\" style=\"color:#d71920; text-decoration:none;\">info@europagar.ee</a></p>\n  <p><i class=\"fa fa-user\"></i> <strong>Müügijuht:</strong> Tiiu Lokko | <a href=\"tel:+37258801699\" style=\"color:#d71920; text-decoration:none;\">+372 5880 1699</a> | <a href=\"mailto:tiiu@europagar.ee\" style=\"color:#d71920; text-decoration:none;\">tiiu@europagar.ee</a></p>\n</div>', '', 'image', '', '', '', '', '', 60, 1, '2026-03-13 07:52:10', '2026-03-13 08:09:15'),
(11, 'privacy', 'privacy-main', 'section', 'Privacy main', 'Privaatsus', 'Küpsised ja privaatsus', '<p class=\"p\">See leht selgitab, kuidas EUROPAGAR kasutab küpsiseid ja sarnaseid tehnoloogiaid, et parandada veebilehe toimimist ja kasutuskogemust.</p><h2 class=\"h\" style=\"font-size:22px;\">Mis on küpsised?</h2><p class=\"p\">Küpsised on väikesed tekstifailid, mis salvestatakse sinu seadmesse, kui külastad veebilehte. Need aitavad näiteks meeles pidada eelistusi ning tagada lehe korrektse töö.</p><h2 class=\"h\" style=\"font-size:22px;\">Milliseid küpsiseid me kasutame?</h2><ul class=\"p\" style=\"margin:0;padding-left:18px;line-height:1.6;\"><li><strong>Vajalikud küpsised</strong> — lehe põhifunktsioonid (nt navigeerimine, turvalisus).</li><li><strong>Funktsionaalsed küpsised</strong> — eelistuste meeldejätmine (kui neid kasutatakse).</li><li><strong>Analüütika</strong> — anonüümne statistika, mis aitab lehte parendada (kui rakendatud).</li></ul><h2 class=\"h\" style=\"font-size:22px;\">Nõusolek ja haldamine</h2><p class=\"p\">Sa saad küpsiste kasutamisega nõustuda küpsiste teavitusribal. Soovi korral saad küpsised kustutada või blokeerida oma brauseri seadetes. Arvesta, et küpsiste piiramine võib mõjutada veebilehe funktsionaalsust.</p><h2 class=\"h\" style=\"font-size:22px;\">Kontakt</h2><p class=\"p\">Kui sul on küsimusi privaatsuse või küpsiste kohta, kirjuta: <a href=\"mailto:info@europagar.ee\">info@europagar.ee</a></p>', '', 'image', '', '', '', '', '', 10, 1, '2026-03-13 07:52:10', '2026-03-13 07:52:10'),
(12, 'kuidas_tellida', 'kuidas-main', 'section', 'Kuidas tellida', 'Tellimus', 'Tellimise tingimused', '<h2 class=\"h\" style=\"font-size:22px;\">1. Kust tooted kätte saate:</h2><p class=\"p\">Kõiki e-poest tellitavad tooted saab kätte Europagar OÜ kontorist aadressilt Trummi 16B, Tallinn 12617.</p><p class=\"p\"><span class=\"text-oval\">Tellitud kauba väljastamine toimub E – R: 08:00 – 16:00 ja L – P: Suletud</span></p><h2 class=\"h\" style=\"font-size:22px;\">Tellimine e-poe kaudu:</h2><ol class=\"p\" style=\"padding-left:18px;line-height:1.7;\"><li>Minge sobivasse tootekategooriasse või kasutage otsingut toodete leidmiseks. Valige toode, mida soovite osta.</li><li>Ostukorvis kontrollige, kas kõik teie soovitud tooted on nimekirjas. Vajutage lingile «Vormista tellimus».</li><li>Olge tellimuse vormistamisel tähelepanelik, sest meile edastatava info täpsusest sõltub tellimuse täitmine.</li><li>Makse sooritamiseks valige sobiv pangalink ja vajutage pärast makset nuppu <span class=\"text-oval\">«TAGASI KAUPMEHE JUURDE».</span></li><li>Makseid võetakse vastu eurodes.</li></ol><p class=\"p\">Olles teie tellimused kätte saanud, saadame kinnituse teie e-posti aadressile.</p><h2 class=\"h\" style=\"font-size:22px;\">Tellimuse täitmise tähtajad:</h2><p class=\"p\">Kui soovite tooteid järgmiseks päevaks, siis peab tellimus olema tehtud enne kella 13:00. Eritellimustortidel on ettetellimisaeg 3 ööpäeva.</p><h2 class=\"h\" style=\"font-size:22px;\">Tellimuse maksumus:</h2><p class=\"p\">Toodete maksumus on välja toodud ostukorvis. Maksmiseks tuleb sooritada ost e-poest ja maksta pangalingi kaudu.</p><h2 class=\"h\" style=\"font-size:22px;\">Tellimine telefoni teel:</h2><p class=\"p\">Helistage tellimisnumbril <span class=\"text-oval\">+372 6 522 366</span> (E-R 8:00 – 16:00).</p><h2 class=\"h\" style=\"font-size:22px;\">Tellimine e-maili teel:</h2><p class=\"p\">Esitage oma tellimus aadressile <span class=\"text-oval\">info@europagar.ee</span>.</p><h2 class=\"h\" style=\"font-size:22px;\">Tellimuse tühistamine:</h2><p class=\"p\">Kliendil on õigus oma tellimus tühistada ja 5 tööpäeva jooksul raha tagasi saada.</p><h2 class=\"h\" style=\"font-size:22px;\">Turvalisus:</h2><p class=\"p\">Kliendiinfo on rangelt konfidentsiaalne ja ei kuulu avalikustamiseks kolmandatele osapooltele.</p>', '', 'image', '', '', '', '', '', 10, 1, '2026-03-13 07:52:10', '2026-03-13 07:52:10'),
(13, 'notfound', 'notfound-main', 'section', '404 põhiblokk', 'Lehte ei leitud', '404', '<p class=\"lead\">Vabandame — otsitud leht puudub või on teisele aadressile kolitud.</p><p class=\"sub\">Kasuta allolevaid nuppe, et liikuda tagasi avalehele, e-poodi või võtta meiega ühendust.</p>', '', 'image', '', 'Avalehele', 'index.html', 'Kontakt', 'index.html#contact', 10, 1, '2026-03-13 07:52:10', '2026-03-13 07:52:10'),
(14, 'cart', 'cart-main', 'section', 'Ostukorv pealkiri', '', 'Ostukorv', '<p class=\"p\">Vaata üle lisatud tooted ja jätka tellimusega siis, kui kõik on õige.</p>', '', 'image', '', '', '', '', '', 10, 1, '2026-03-13 07:52:10', '2026-03-13 07:52:10'),
(15, 'cart', 'cart-actions', 'section', 'Ostukorv nupud', '', '', '', '', 'image', '', 'Tagasi', 'javascript:history.back()', 'Mine maksma', 'checkout.html', 20, 1, '2026-03-13 07:52:10', '2026-03-13 07:52:10'),
(16, 'checkout', 'checkout-head', 'section', 'Checkout pealkiri', '', 'Ostu vormistamine', '<span>Avaleht</span><span>→</span><span>Ostukorv</span><span>→</span><strong>Mine maksma</strong>', '', 'image', '', '', '', '', '', 10, 1, '2026-03-13 07:52:10', '2026-03-13 07:52:10'),
(17, 'checkout', 'checkout-login-notice', 'section', 'Checkout login notice', '', '', 'Oled juba klient? <a href=\"#login\" id=\"openLogin\">sisselogimiseks kliki siia</a>', '', 'image', '', '', '', '', '', 20, 1, '2026-03-13 07:52:10', '2026-03-13 07:52:10'),
(18, 'checkout', 'checkout-login', 'section', 'Checkout login', 'Logi sisse', 'Logi sisse', '<p class=\"hint\">Kui oled meilt varem ostnud, siis sisesta oma andmed allolevatesse lahtritesse. Kui oled uus klient, siis palun liigu edasi arvelduse sektsiooni.</p>', '', 'image', '', 'Logi sisse', '#login', 'Kaotasid parooli?', '#forgot', 30, 1, '2026-03-13 07:52:10', '2026-03-13 07:52:10'),
(19, 'checkout', 'checkout-billing', 'section', 'Checkout billing', 'Arveldamine ja transport', 'Arveldamine ja transport', '<p class=\"hint\">Sisesta arve- ja kontaktandmed, et saaksime tellimuse õigesti töödelda.</p>', '', 'image', '', '', '', '', '', 40, 1, '2026-03-13 07:52:10', '2026-03-13 07:52:10'),
(20, 'checkout', 'checkout-notes', 'section', 'Checkout notes', 'Lisainfo', 'Lisainfo', '<p class=\"hint\">Lisa siia kättetoimetamise või tellimuse täpsustused.</p>', '', 'image', '', '', '', '', '', 50, 1, '2026-03-13 07:52:10', '2026-03-13 07:52:10'),
(21, 'checkout', 'checkout-order-summary', 'section', 'Checkout summary', 'Sinu tellimus', 'Sinu tellimus', '<p class=\"hint\">Kontrolli enne maksmist tellimuse sisu ja kogusummat.</p>', '', 'image', '', 'Tagasi', 'cart.html', '', '', 60, 1, '2026-03-13 07:52:10', '2026-03-13 07:52:10'),
(22, 'checkout', 'checkout-payment', 'section', 'Checkout payment', 'Makse', 'Makse', '<p class=\"hint\">Vali pank või makseviis. Pärast nupu vajutamist suunatakse sind makselehele.</p>', '', 'image', '', '', '', '', '', 70, 1, '2026-03-13 07:52:10', '2026-03-13 07:52:10'),
(23, 'reset_password', 'reset-main', 'section', 'Reset password main', '', 'Parooli taastamine', 'Sisesta uus parool. Link kehtib 1 tund.', '', 'image', '', 'Uuenda parool', '#submit', 'Logi sisse', 'checkout.html#login', 10, 1, '2026-03-13 07:52:10', '2026-03-13 07:52:10'),
(24, 'shop_category', 'shop-category-main', 'section', 'Shop category header', 'E-Pood', 'E-Pood', '<p class=\"p\">Tutvu valitud kategooria toodetega.</p>', '', 'image', '', 'Tagasi', 'index.html#shop', '', '', 10, 1, '2026-03-13 07:52:10', '2026-03-13 07:52:10');

-- --------------------------------------------------------

--
-- Структура таблицы `users`
--

CREATE TABLE `users` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `email` varchar(190) NOT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `first_name` varchar(100) DEFAULT NULL,
  `last_name` varchar(100) DEFAULT NULL,
  `avatar_url` varchar(255) DEFAULT NULL,
  `is_verified` tinyint(1) NOT NULL DEFAULT 0,
  `password_hash` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Дамп данных таблицы `users`
--

INSERT INTO `users` (`id`, `email`, `phone`, `first_name`, `last_name`, `avatar_url`, `is_verified`, `password_hash`, `created_at`, `updated_at`) VALUES
(1, 'info@eurpgr.ee', '+3726522366', 'EUROPAGAR', 'OFFICIAL', '/uploads/avatars/u1_1773167583.png', 1, '$2y$12$9DxrcyU7D81vNQZM6tkTXu21TDSyGV9YO.WxInj6qBVJeZYGpJsgu', '2026-03-05 19:29:07', '2026-03-13 08:11:36'),
(2, 'leskov.studio.official@gmail.com', '+37253933658', 'Igor', 'Leskov', '/uploads/avatars/u2_1773241437.jpg', 1, '$2y$12$zrO749bdxoYWuLpudkfZsubsiaQOc9pCWMg8M3E5jhq09T9g0bSku', '2026-03-11 12:49:14', '2026-03-13 21:47:43');

-- --------------------------------------------------------

--
-- Структура таблицы `user_password_resets`
--

CREATE TABLE `user_password_resets` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `token_hash` char(64) NOT NULL,
  `expires_at` datetime NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Структура таблицы `user_remember_tokens`
--

CREATE TABLE `user_remember_tokens` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `selector` char(24) NOT NULL,
  `token_hash` char(64) NOT NULL,
  `expires_at` datetime NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Индексы сохранённых таблиц
--

--
-- Индексы таблицы `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_id` (`user_id`);

--
-- Индексы таблицы `order_items`
--
ALTER TABLE `order_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_order_id` (`order_id`);

--
-- Индексы таблицы `shop_categories`
--
ALTER TABLE `shop_categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_shop_categories_slug` (`slug`);

--
-- Индексы таблицы `shop_products`
--
ALTER TABLE `shop_products`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_shop_products_cat` (`category_id`,`sort`,`id`);

--
-- Индексы таблицы `site_content_blocks`
--
ALTER TABLE `site_content_blocks`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_site_content_page_block` (`page_key`,`block_key`),
  ADD KEY `idx_site_content_page_sort` (`page_key`,`sort`,`id`);

--
-- Индексы таблицы `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_users_email` (`email`),
  ADD KEY `idx_users_is_verified` (`is_verified`);

--
-- Индексы таблицы `user_password_resets`
--
ALTER TABLE `user_password_resets`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_id` (`user_id`);

--
-- Индексы таблицы `user_remember_tokens`
--
ALTER TABLE `user_remember_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_selector` (`selector`),
  ADD KEY `idx_user_id` (`user_id`);

--
-- AUTO_INCREMENT для сохранённых таблиц
--

--
-- AUTO_INCREMENT для таблицы `orders`
--
ALTER TABLE `orders`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT для таблицы `order_items`
--
ALTER TABLE `order_items`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT для таблицы `shop_categories`
--
ALTER TABLE `shop_categories`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT для таблицы `shop_products`
--
ALTER TABLE `shop_products`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT для таблицы `site_content_blocks`
--
ALTER TABLE `site_content_blocks`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6505;

--
-- AUTO_INCREMENT для таблицы `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT для таблицы `user_password_resets`
--
ALTER TABLE `user_password_resets`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT для таблицы `user_remember_tokens`
--
ALTER TABLE `user_remember_tokens`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- Ограничения внешнего ключа сохраненных таблиц
--

--
-- Ограничения внешнего ключа таблицы `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `fk_orders_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Ограничения внешнего ключа таблицы `order_items`
--
ALTER TABLE `order_items`
  ADD CONSTRAINT `fk_items_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE;

--
-- Ограничения внешнего ключа таблицы `shop_products`
--
ALTER TABLE `shop_products`
  ADD CONSTRAINT `fk_shop_products_cat` FOREIGN KEY (`category_id`) REFERENCES `shop_categories` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Ограничения внешнего ключа таблицы `user_password_resets`
--
ALTER TABLE `user_password_resets`
  ADD CONSTRAINT `fk_resets_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Ограничения внешнего ключа таблицы `user_remember_tokens`
--
ALTER TABLE `user_remember_tokens`
  ADD CONSTRAINT `fk_tokens_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
