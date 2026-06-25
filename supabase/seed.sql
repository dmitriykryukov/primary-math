-- supabase/seed.sql  (run in SQL editor after migrations)

-- Grade 5 lessons
insert into public.lessons (grade, order_index, title_en, title_fr, topic) values
(5,1,'Multiplication ×1–2','Multiplication ×1–2','mult_1_2'),
(5,2,'Multiplication ×3–4','Multiplication ×3–4','mult_3_4'),
(5,3,'Multiplication ×5–6','Multiplication ×5–6','mult_5_6'),
(5,4,'Mixed ×1–6','Mixte ×1–6','mult_mix_1_6'),
(5,5,'Multiplication ×7–8','Multiplication ×7–8','mult_7_8'),
(5,6,'Multiplication ×9–10','Multiplication ×9–10','mult_9_10'),
(5,7,'Multiplication ×11–12','Multiplication ×11–12','mult_11_12'),
(5,8,'Mixed ×7–12','Mixte ×7–12','mult_mix_7_12'),
(5,9,'Mixed ×1–12 (I)','Mixte ×1–12 (I)','mult_mix_all_1'),
(5,10,'Mixed ×1–12 (II)','Mixte ×1–12 (II)','mult_mix_all_2'),
(5,11,'Division ÷1–4','Division ÷1–4','div_1_4'),
(5,12,'Division ÷5–6','Division ÷5–6','div_5_6'),
(5,13,'Division ÷7–8','Division ÷7–8','div_7_8'),
(5,14,'Division ÷9–10','Division ÷9–10','div_9_10'),
(5,15,'Division ÷11–12','Division ÷11–12','div_11_12'),
(5,16,'Mixed ÷1–12 (I)','Division mixte (I)','div_mix_1'),
(5,17,'Mixed ÷1–12 (II)','Division mixte (II)','div_mix_2'),
(5,18,'Mult & Div Mixed','Mult & Div Mixte','mult_div_mix'),
(5,19,'Equivalent Fractions (I)','Fractions équivalentes (I)','frac_equiv_1'),
(5,20,'Equivalent Fractions (II)','Fractions équivalentes (II)','frac_equiv_2'),
(5,21,'Comparing Fractions (I)','Comparer les fractions (I)','frac_compare_1'),
(5,22,'Comparing Fractions (II)','Comparer les fractions (II)','frac_compare_2'),
(5,23,'Adding Fractions (same denom I)','Additionner fractions (même dénom. I)','frac_add_same_1'),
(5,24,'Adding Fractions (same denom II)','Additionner fractions (même dénom. II)','frac_add_same_2'),
(5,25,'Adding Fractions (mixed)','Additionner fractions (mixte)','frac_add_same_mix'),
(5,26,'Subtracting Fractions (I)','Soustraire fractions (I)','frac_sub_same_1'),
(5,27,'Subtracting Fractions (II)','Soustraire fractions (II)','frac_sub_same_2'),
(5,28,'Subtracting Fractions (mixed)','Soustraire fractions (mixte)','frac_sub_same_mix'),
(5,29,'Add & Subtract Fractions','Additionner & Soustraire','frac_add_sub_mix'),
(5,30,'Grade 5 Final Review','Révision finale 5e','g5_review');

-- Grade 6 lessons
insert into public.lessons (grade, order_index, title_en, title_fr, topic) values
(6,1,'2-digit × 1-digit (I)','2 chiffres × 1 chiffre (I)','mult_2x1_1'),
(6,2,'2-digit × 1-digit (II)','2 chiffres × 1 chiffre (II)','mult_2x1_2'),
(6,3,'2-digit × 2-digit (I)','2 chiffres × 2 chiffres (I)','mult_2x2_1'),
(6,4,'2-digit × 2-digit (II)','2 chiffres × 2 chiffres (II)','mult_2x2_2'),
(6,5,'Hard Multiplication (I)','Multiplication difficile (I)','mult_hard_1'),
(6,6,'Hard Multiplication (II)','Multiplication difficile (II)','mult_hard_2'),
(6,7,'Mixed Mult Review','Révision Multiplication','mult_g6_review'),
(6,8,'Division with Remainders (I)','Division avec restes (I)','div_rem_1'),
(6,9,'Division with Remainders (II)','Division avec restes (II)','div_rem_2'),
(6,10,'Division with Remainders (III)','Division avec restes (III)','div_rem_3'),
(6,11,'Long Division (I)','Division longue (I)','div_long_1'),
(6,12,'Long Division (II)','Division longue (II)','div_long_2'),
(6,13,'Mixed Division Review','Révision Division','div_g6_review'),
(6,14,'Unlike Denominators — Find LCD','Dénominateurs différents — PPCM','frac_lcd_1'),
(6,15,'Unlike Denominators — Add (I)','Dénominateurs différents — Addition (I)','frac_add_unlike_1'),
(6,16,'Unlike Denominators — Add (II)','Dénominateurs différents — Addition (II)','frac_add_unlike_2'),
(6,17,'Unlike Denominators — Sub (I)','Dénominateurs différents — Soustraction (I)','frac_sub_unlike_1'),
(6,18,'Unlike Denominators — Sub (II)','Dénominateurs différents — Soustraction (II)','frac_sub_unlike_2'),
(6,19,'Add & Sub Unlike (mixed)','Addition & Soustraction mixte','frac_add_sub_unlike'),
(6,20,'Multiply Fractions (I)','Multiplier les fractions (I)','frac_mult_1'),
(6,21,'Multiply Fractions (II)','Multiplier les fractions (II)','frac_mult_2'),
(6,22,'Multiply Fractions (simplify)','Multiplier fractions (simplifier)','frac_mult_simplify'),
(6,23,'Multiply Mixed Numbers','Multiplier les nombres mixtes','frac_mult_mixed'),
(6,24,'Divide Fractions (I)','Diviser les fractions (I)','frac_div_1'),
(6,25,'Divide Fractions (II)','Diviser les fractions (II)','frac_div_2'),
(6,26,'Divide Mixed Numbers','Diviser les nombres mixtes','frac_div_mixed'),
(6,27,'Fractions — Word Problems (I)','Fractions — Problèmes (I)','frac_word_1'),
(6,28,'Fractions — Word Problems (II)','Fractions — Problèmes (II)','frac_word_2'),
(6,29,'Mixed Fractions Review','Révision fractions','frac_g6_review'),
(6,30,'Grade 6 Final Review','Révision finale 6e','g6_review');

-- Admin user setup (run manually after creating user via Supabase dashboard Auth UI):
-- Replace <uuid-from-supabase-dashboard> with the actual UUID of the user you created.
--
-- insert into public.users (id, username, role, language)
-- values ('<uuid-from-supabase-dashboard>', 'admin', 'admin', 'en');
