# Sacré Cœur

Application scolaire React / TypeScript reposant sur Supabase. Le dépôt contient deux applications indépendantes : le site de l'école avec les espaces parent et enseignant, et le dashboard de l'administration. Les composants visuels, les images et les styles existants ont été conservés.

L'administration possède son propre point d'entrée, son propre routeur et son propre build. Le site ne propose aucune connexion admin et `/admin` y affiche la page introuvable. En production, le build admin peut être hébergé sur un sous-domaine de votre domaine réel ; aucun domaine ni déploiement n'a été créé par ce refactoring.

## Démarrer

Prérequis : **Node.js 24 ou supérieur**, npm et un projet Supabase configuré avec les tables de l'application. Les tests importent directement les modules TypeScript avec Node ; aucune compilation de test supplémentaire n'est nécessaire.

Exécuter les commandes depuis `sacre-coeur-project` :

```bash
npm ci
npm run dev
```

Sous PowerShell, utiliser `npm.cmd` si la politique d'exécution bloque `npm.ps1`.

Le fichier `.env` à la racine est lu par les deux applications. Pour une nouvelle installation, reprendre les noms de `.env.example`, puis renseigner les valeurs de votre projet :

```dotenv
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

Ces variables sont intégrées au frontend au moment du build. La clé publique n'accorde pas les droits administratifs : les permissions des données doivent être définies par les policies Supabase. La clé `SUPABASE_SERVICE_ROLE_KEY` reste exclusivement côté serveur.

| Commande | Résultat |
| --- | --- |
| `npm run dev` | Site sur `http://localhost:5173`, admin sur `http://localhost:5174` |
| `npm run dev:site` | Démarre seulement le site |
| `npm run dev:admin` | Démarre seulement l'administration |
| `npm run typecheck` | Vérifie le TypeScript strict des applications, packages et fonctions serveur |
| `npm run lint` | Vérifie le code et les dépendances interdites entre couches |
| `npm test` | Tests des règles métier et du gestionnaire des comptes enseignants |
| `npm run build` | Vérifie les types et construit les deux applications |
| `npm run check` | Lint, build puis tests |
| `npm run preview:site` | Prévisualise le build du site sur le port 6173 |
| `npm run preview:admin` | Prévisualise le build admin sur le port 6174 |
| `npm run test:browser` | Contrôles anonymes desktop/mobile avec Chrome ou Edge |

Le contrôle navigateur démarre ses propres serveurs sur les ports 4280 et 4281, utilise un profil temporaire et écrit les captures dans `.tmp/screenshots`. Il nécessite Chrome ou Edge installé ; `BROWSER_EXECUTABLE` permet d'indiquer un autre chemin vers leur exécutable.

## Organisation du dépôt

```text
apps/
  site/
    src/
      app/                     # Routeur du site
      features/                # Pages et hooks par fonctionnalité
      layouts/                 # Vitrine, espace parent et espace enseignant
      assets/                  # Images importées par le site
    public/                    # Médias accessibles par URL
    dist/                      # Build du site, ignoré par Git
  admin/
    src/
      app/                     # Routeur de l'administration
      features/                # Classes, enseignants, inscriptions, finance…
      layouts/                 # Navigation de l'administration
    public/
    dist/                      # Build admin, ignoré par Git
packages/
  domain/                      # Contrats, validation et calculs métier purs
  data-access/                 # Client Supabase, services et requêtes
  auth/                        # Session, fournisseur d'authentification, gardes
  ui/                          # Composants visuels, styles et préférences UI
  school-features/             # Fonctionnalités scolaires réellement partagées
supabase/
  functions/teacher-accounts/  # Création, invitation et suppression enseignants
  migrations/README.md        # État du schéma et procédure de récupération
  tests/                      # Tests des autorisations et commandes serveur
config/                       # Configuration Vite commune
scripts/                      # Démarrage et vérifications
docs/                         # Analyse d'architecture initiale
```

Les workspaces npm relient ces dossiers avec les imports `@sacre-coeur/...`. Les applications consomment directement le code TypeScript des packages ; Vite le compile dans chaque build. L'alias `@/` désigne uniquement le `src` de l'application concernée. Un package partagé n'importe jamais une application.

### Où placer une modification ?

| Responsabilité | Emplacement | Exemple présent |
| --- | --- | --- |
| Règle indépendante de React et du serveur | `packages/domain` | Calcul financier, validation d'une note, chevauchement d'horaires |
| Lecture/écriture et adaptation des lignes Supabase | `packages/data-access` | `payment.service.ts`, `Student.service.ts` |
| Identité et restrictions de navigation | `packages/auth` | `AuthProvider`, `RequireRole`, `GuestOnly` |
| Présentation réutilisable | `packages/ui` | Boutons, tableaux, shell de dashboard, formulaire de connexion |
| Parcours utilisé par plusieurs espaces | `packages/school-features` | Profil élève, paramètres du compte, documents PDF |
| Écran propre à un espace | `apps/*/src/features` | Paiements admin, cours parent, cotations enseignant |
| Opération utilisant les droits Auth admin | `supabase/functions` | Invitation d'un enseignant |

Une page compose les composants et déclenche les actions. Les hooks coordonnent les données, mutations et invalidations. Les services appliquent leurs validations et adaptent les contrats de stockage, sans afficher de toast. Les notifications restent dans la couche interface. Les règles de calcul ne dépendent ni du navigateur ni de Supabase.

**SRP** : session, thème, accès aux données et présentation ont des responsabilités distinctes. **DRY** : les deux applications utilisent les mêmes composants, règles et services ; le profil élève et la génération PDF sont partagés. **KISS** : deux applications Vite, cinq packages ciblés et le backend déjà utilisé, avec des dépendances explicites dans chaque manifeste.

Les règles ESLint empêchent notamment le domaine d'importer React ou Supabase, l'UI d'importer le métier, et les services d'importer les composants ou Sonner. Le découpage des grandes pages se poursuit naturellement par fonctionnalité lorsqu'elles évoluent ; chaque fichier n'a pas été transformé en un composant artificiel.

## Routes et design

Le site conserve la vitrine, `/ecole`, `/autorites`, `/confidentialite`, `/support`, `/inscription` et `/login`. Les espaces authentifiés utilisent `/parent/...` et `/teacher/...`. La connexion publique propose uniquement Parent et Enseignant.

L'administration utilise `/login`, puis `/`, `/classes`, `/enseignants`, `/validations`, `/paiements`, `/mode-de-paiement`, `/horaires`, `/cours`, `/annonces`, `/archives`, `/palmares`, `/parametre` et `/profile`. Les anciennes URL `/admin/...` ne sont plus les URL de cette application.

Les pages sont chargées à la demande avec `React.lazy`. Les styles Tailwind communs et les composants Radix existants restent dans `packages/ui`. Le thème clair/sombre possède son propre store de préférences, indépendant de la session. Les deux builds ne partagent pas un routeur et le site n'importe pas les pages admin.

## Session et comptes

La session affichée provient de Supabase Auth et du rôle lu dans `profiles`, après vérification de l'utilisateur avec `getUser()`. Un rôle persisté dans le navigateur ne suffit pas à ouvrir un dashboard. Le fournisseur écoute les changements de session, refuse les rôles non autorisés pour l'application et vide le cache des requêtes lors d'un changement d'identité ou d'une déconnexion.

Les gardes React améliorent la navigation. Les permissions réelles restent à appliquer dans la base et le Storage : une séparation en sous-domaines ne remplace pas les policies RLS.

Les parents conservent leur inscription depuis le site. La création Auth, `profiles` et `parents` est une opération en plusieurs étapes ; la configuration de confirmation d'email et les policies du projet distant doivent être compatibles. La suppression de son compte appelle la RPC existante `delete_user_account`, dont la définition SQL n'était pas présente dans le dépôt.

### Enseignants

L'admin crée un enseignant depuis l'écran existant. Le navigateur appelle la fonction `teacher-accounts`. Celle-ci vérifie le JWT, relit le rôle admin en base, valide les classes et impose le rôle `teacher` côté serveur. Elle conserve le contrat `enseignants_details` existant, crée un nouveau compte Auth, initialise son profil, lie son `user_id` puis envoie l'invitation. Un email appartenant déjà à un autre compte Auth exige une vérification administrative ; ce compte n'est pas réaffecté automatiquement.

Le lien reçu conduit au site sur `/auth/invitation`. L'enseignant définit son mot de passe après réception d'un callback Supabase d'invitation ou de récupération et vérification de sa session. Le marqueur de callback est conservé seulement en mémoire ; aucun token supplémentaire n'est enregistré par l'application. En cas de rechargement de cette page, un nouveau lien peut être nécessaire.

Le bouton d'invitation permet aussi de reprendre un compte ancien non lié. Pour un compte déjà lié, le lien utilise l'email confirmé du compte Auth. Un enseignant activé change son email depuis les paramètres de son compte, afin de conserver la cohérence entre Auth et ses détails.

Les échecs partiels sont signalés. Une invitation non envoyée laisse la fiche disponible pour réessayer. La compensation d'une création ne supprime que le compte Auth venant d'être créé. Les opérations DB/Auth ne constituent pas une transaction SQL ; une suppression partiellement échouée peut nécessiter une intervention dans Supabase.

## Règles métier conservées et corrigées

- Les inscriptions utilisent les statuts présents dans les écritures d'origine : `en_attente`, `accepte`, `rejete`. La classe d'une inscription acceptée est distinguée d'une nouvelle demande en attente.
- L'année scolaire conserve la bascule existante au 1er juillet. Les règles de réinscription utilisent les classes et filières déjà décrites par le projet.
- Les montants sont finis et positifs ; les tranches sont 1, 2 ou 3. Les devises USD et FC sont calculées séparément, sans taux de conversion ajouté.
- Sans configuration de frais, l'élève n'est pas déclaré en ordre financièrement. Les paiements sont filtrés par élève, année et, selon l'écran, parent.
- Les reçus PDF sont générés à partir des paiements chargés. L'appel à une URL `/api/receipts/...` sans implémentation a été supprimé.
- Les notes utilisent `grades` et sont validées par rapport à leur barème. Les cotations s'appuient sur les classes affectées à l'enseignant.
- Les horaires valident les heures de début/fin et les chevauchements. Les créneaux adjacents restent possibles.
- Les enseignants sont liés aux classes par `enseignants_details.assignedclasses`, source déjà utilisée par les écrans actifs.
- Les palmarès affichent les archives de catégorie `Palmarès`. Aucune règle de classement officiel n'a été inventée.
- Les données de démonstration du store scolaire ont été retirées. Les statistiques utilisent les services existants.
- Le billet de vacances référencé dans l'ancien code est absent des fichiers du dépôt : son action indique cette indisponibilité.

## Backend Supabase : préparation et limites

Le dossier `supabase` versionne le code serveur nécessaire aux comptes enseignants et ses tests. `migrations` ne contient pas de SQL inventé : le dépôt initial ne fournissait ni DDL, ni policies, ni définition des RPC. Lire [supabase/migrations/README.md](supabase/migrations/README.md) avant toute évolution du schéma.

Avant utilisation des actions enseignants sur un environnement réel, installer la CLI Supabase, lier le **projet réel**, configurer `SITE_URL` et `ADMIN_ORIGIN`, puis déployer `teacher-accounts`. `supabase/.env.example` donne les valeurs locales. En production, renseigner les deux origines réelles. La fonction obtient `SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` dans son environnement serveur.

```bash
supabase login
supabase link --project-ref IDENTIFIANT_DU_PROJET_REEL
supabase secrets set SITE_URL=https://DOMAINE_DU_SITE ADMIN_ORIGIN=https://SOUS_DOMAINE_ADMIN
supabase functions deploy teacher-accounts
```

Ces commandes de déploiement sont documentées et n'ont pas été exécutées. La fonction garde `verify_jwt = true` et vérifie également l'utilisateur dans son gestionnaire. Voir les guides officiels [sécurisation des fonctions](https://supabase.com/docs/guides/functions/auth) et [déploiement](https://supabase.com/docs/guides/functions/deploy).

Ajouter l'URL exacte `/auth/invitation` du site dans les redirections Auth autorisées et vérifier le modèle d'email correspondant. Les réglages sont décrits dans [la documentation des redirections Supabase](https://supabase.com/docs/guides/auth/redirect-urls).

### Contrats à confronter à la base réelle

| Élément | Contrat utilisé par le code |
| --- | --- |
| `profiles` | Identité Auth et rôle ; l'utilisateur ne doit pas pouvoir s'attribuer admin |
| `enseignants_details` | ID de fiche, `user_id` Auth, `assignedclasses` contenant les ID de classes |
| `grades.teacher_id` | ID utilisateur Auth de l'enseignant |
| `schedule_entries.teacher_id` | ID de la fiche `enseignants_details`, distinct de l'ID Auth |
| `mode_paiement` | `class_id`, `class_name`, `created_at`, `schoolYear`, `amount`, `currency`, `tranche`, `reason` |
| `delete_user_account` | RPC déjà appelée dans l'application d'origine, SQL absent du dépôt |

Les anciens services de `mode_paiement` lisaient et écrivaient des noms de colonnes contradictoires. Lecture et écriture utilisent maintenant le contrat de lecture initial ; sa correspondance avec le schéma distant doit être vérifiée avant d'utiliser la configuration de frais.

Vérifier les policies parent/enfants, enseignant/classes/notes, admin, ainsi que les buckets réellement utilisés par les services d'archives et de cours. Les contrôles client des doublons et chevauchements ne protègent pas à eux seuls contre des écritures concurrentes : les contraintes SQL doivent être établies à partir du schéma réel. Aucune policy distante, cascade, transaction, migration ou autorisation Storage n'a été certifiée par ce travail local.

## Validation et évolution

Les tests locaux couvrent les calculs financiers, montants/devise/tranche, notes, horaires, année scolaire, réinscriptions, invitations, rôles serveur, suppressions ciblées et compensations. Ils utilisent des doubles de Supabase et n'envoient aucun email réel. Le TypeScript vérifie aussi les fonctions serveur ; leur exécution sur Deno et leur déploiement distant nécessitent un environnement Supabase.

Le contrôle navigateur couvre les pages publiques et connexions, la séparation admin et le rendu desktop/mobile. Il ne valide pas les parcours authentifiés de bout en bout : ils nécessitent une base réelle, ses droits et des comptes de test autorisés.

La structure permet des déploiements indépendants et des requêtes ciblées avec TanStack Query. Certaines listes administratives chargent encore l'ensemble des données : aucune pagination globale ni capacité de trafic chiffrée n'est annoncée. Les prochaines optimisations doivent partir des volumes observés, puis ajouter pagination, index et agrégations au schéma vérifié.

Pour héberger les applications, publier séparément `apps/site/dist` et `apps/admin/dist`. Chaque hébergement doit renvoyer son propre `index.html` pour les routes SPA. Configurer ensuite le domaine principal et le sous-domaine admin, les variables de build et les retours Auth correspondants.

L'analyse initiale reste disponible dans [docs/architecture-proposee.md](docs/architecture-proposee.md). Ce README décrit l'organisation effectivement implémentée et les limites de validation.
