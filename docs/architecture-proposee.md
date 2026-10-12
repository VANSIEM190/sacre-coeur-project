# Architecture proposée — Sacré Cœur

Date : 12 octobre 2026. Statut : analyse initiale, suivie de l'implémentation locale des deux applications et des packages partagés.

Le [README du projet](../README.md) décrit maintenant l'architecture effectivement implémentée, les commandes et les limites de validation. Les observations ci-dessous décrivent le dépôt **avant refactoring** ; les recommandations sur le schéma, les droits, le déploiement et la pagination restent à confronter à l'environnement réel.

## 1. Décision recommandée

Conserver React, TypeScript, Vite et Supabase. Organiser le projet en **monorepo avec deux applications indépendantes**, un backend Supabase commun et des modules métier explicites.

- `apps/site` : vitrine de l'école, inscription des parents, connexion parent/enseignant et leurs espaces.
- `apps/admin` : connexion de l'administration et toutes les fonctionnalités administratives.
- `packages/*` : code réellement commun, utilisé par les deux applications.
- `supabase/*` : schéma, droits, règles serveur et fonctions versionnés.

Le monorepo est un seul dépôt Git contenant plusieurs applications. Le backend est organisé par domaines métier tout en conservant une base PostgreSQL commune. Cela permet de maintenir les contrats ensemble et de déployer les interfaces séparément.

« L'admin hérite du projet » signifie ici qu'il réutilise les mêmes composants, contrats et données. Il ne dépend pas du code de l'application publique.

Pour la situation actuelle, deux applications suffisent. Un portail parent/enseignant séparé pourra être extrait plus tard si son rythme d'évolution ou ses besoins le justifient. La proposition initiale ne nécessite ni microservices, ni nouvelle API générale, ni changement de framework.

## 2. Éléments observés dans le projet

| Élément actuel | Observation | Conséquence pour l'architecture |
| --- | --- | --- |
| `src/App.tsx` | Importe les pages publiques, admin, parent et enseignant dans la même application | Séparer les points d'entrée, routeurs et builds |
| `src/routes/login.tsx` | Propose le rôle `Administration` avec les autres rôles | Créer une connexion admin propre à son application |
| `src/components/public-header.tsx` | Le lien « Mon espace » peut mener vers `/admin` | Supprimer toute navigation admin de l'interface publique |
| `src/components/Dashboard-shell.tsx` | Mélange présentation et contrôle du rôle à partir du store local | Garder un shell visuel et déplacer les gardes dans la couche application |
| `src/stores/auth-store.ts` | Mélange utilisateur courant, thème, inscription parent et création enseignant | Séparer session, état UI et opérations métier |
| `src/stores/school-store.ts` | Initialise et persiste des données de démonstration dans le navigateur | Migrer les écrans actifs vers la source serveur commune |
| `src/lib/types.ts` et services | Contrats et statuts parfois incohérents | Définir les contrats par domaine et les aligner sur la base |
| `src/routes/*` | Plusieurs écrans dépassent 500 lignes | Extraire formulaires, hooks et composants par fonctionnalité |
| Dépôt | Pas de migrations SQL, de fonctions serveur ni de CI trouvées | Versionner la configuration et rendre les validations reproductibles |

Les données locales sont encore utilisées par `admin.palmares.tsx`, `teacher.cotations.tsx`, `teacher.index.tsx` et les reçus de `parent.index.tsx`. Elles ne se synchroniseront pas entre le domaine public et le sous-domaine admin.

L'authentification récupère déjà le rôle dans `profiles` lors de la connexion, ce qui constitue une base utile. En revanche, aucune initialisation de session via `getSession` ni écoute `onAuthStateChange` n'a été trouvée dans `src`. L'utilisateur affiché persiste dans un store local.

Limite de l'analyse : le dépôt ne contient pas le schéma SQL et les policies de la base distante. Leur absence dans Git ne prouve pas leur absence dans Supabase. Les autorisations déployées doivent être inspectées avant la mise en production.

## 3. Applications, domaines et navigation

Les domaines ci-dessous sont des exemples à remplacer par le domaine réel.

| Application | Adresse | Fonctionnement |
| --- | --- | --- |
| Site | `https://www.ecole.example` | Vitrine, inscription parent, connexion parent/enseignant |
| Espace parent | `https://www.ecole.example/parent` | Enfants, inscriptions, cours, horaires et documents autorisés |
| Espace enseignant | `https://www.ecole.example/teacher` | Classes affectées, horaires et notes |
| Administration | `https://admin.ecole.example` | Dashboard et gestion administrative |
| Connexion admin | `https://admin.ecole.example/login` | Connexion réservée aux comptes administrateurs |

Règles de séparation :

1. Le routeur du site ne déclare aucune route admin et n'importe aucune page admin.
2. Le site n'affiche ni choix `Administration`, ni lien vers l'admin. Sa connexion est destinée aux parents et enseignants.
3. L'application admin possède son propre routeur : `/`, `/classes`, `/enseignants`, `/paiements`, etc. Le préfixe `/admin` devient inutile sur son sous-domaine.
4. Le login admin vérifie le rôle réel du compte ; un compte parent ou enseignant n'ouvre pas son dashboard.
5. Chaque application a son `index.html`, son point d'entrée React, son build, ses variables de configuration et son déploiement.
6. Les deux applications utilisent la même base Supabase pour un environnement donné. Développement et production utilisent des environnements distincts.

Le stockage local est propre à chaque origine, donc les sessions locales du site et de l'admin sont distinctes. Partager une base et des comptes ne connecte pas automatiquement les deux applications. Ce comportement convient au besoin actuel. Voir [la documentation de localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage).

## 4. Arborescence cible

```text
sacre-coeur-project/
├── apps/
│   ├── site/
│   │   ├── src/
│   │   │   ├── app/                  # Router, providers, session, configuration
│   │   │   ├── layouts/              # PublicLayout, ParentLayout, TeacherLayout
│   │   │   ├── features/
│   │   │   │   ├── public/
│   │   │   │   ├── auth/
│   │   │   │   ├── children/
│   │   │   │   ├── enrollments/
│   │   │   │   ├── courses/
│   │   │   │   ├── schedules/
│   │   │   │   ├── grades/
│   │   │   │   ├── announcements/
│   │   │   │   ├── finance/
│   │   │   │   └── profile/
│   │   │   └── assets/
│   │   ├── public/
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   └── package.json
│   └── admin/
│       ├── src/
│       │   ├── app/                  # Router, providers, garde admin
│       │   ├── layouts/              # AdminLayout, AuthLayout
│       │   └── features/
│       │       ├── auth/
│       │       ├── dashboard/
│       │       ├── students/
│       │       ├── enrollments/
│       │       ├── classes/
│       │       ├── teachers/
│       │       ├── courses/
│       │       ├── schedules/
│       │       ├── grades/
│       │       ├── finance/
│       │       ├── announcements/
│       │       ├── archives/
│       │       └── settings/
│       ├── public/
│       ├── index.html
│       ├── vite.config.ts
│       └── package.json
├── packages/
│   ├── ui/                           # Composants visuels et styles communs
│   ├── domain/                       # Types, schémas Zod et règles pures
│   └── data-access/                  # Client Supabase, services et mappings
├── supabase/
│   ├── migrations/                   # Tables, contraintes, index, RLS, RPC
│   ├── functions/                    # Commandes nécessitant un serveur
│   ├── tests/                        # Droits et règles SQL
│   ├── config.toml
│   └── seed.sql                      # Données locales de développement
├── docs/
├── package.json                      # Workspaces et scripts globaux
└── package-lock.json
```

Commencer avec ces trois packages partagés. Ajouter `packages/config` seulement si les configurations TypeScript/ESLint se dupliquent. Un package `auth` ou `reports` est possible lorsque le code commun justifie réellement cette extraction ; il n'est pas nécessaire dès le départ.

Conserver npm et utiliser les [npm workspaces](https://docs.npmjs.com/cli/v11/using-npm/workspaces/) pour gérer les applications et packages depuis la racine. Configuration proposée : `"workspaces": ["apps/*", "packages/*"]`. Le dépôt possède déjà un `package-lock.json` ; changer de gestionnaire n'est pas nécessaire pour cette architecture.

## 5. Responsabilités et dépendances

| Zone | Responsabilité | Dépendances autorisées |
| --- | --- | --- |
| `apps/*/src/app` | Assemblage, routes, providers, session et gardes | Features de son application et packages |
| `apps/*/src/layouts` | Composition des espaces public, parent, enseignant, admin | UI commune et contexte de l'application |
| `apps/*/src/features` | Pages, formulaires, hooks et interactions du métier | UI, domain, data-access |
| `packages/ui` | Boutons, tableaux, modales, tokens et shell visuel | Bibliothèques UI ; aucun accès métier/Supabase |
| `packages/domain` | Contrats, validations de données et règles pures | TypeScript et Zod ; aucune dépendance React/Supabase |
| `packages/data-access` | Accès aux données, appels RPC/fonctions et conversion DB ↔ métier | Domain et SDK Supabase |
| `supabase` | Persistance, permissions et règles faisant autorité | SQL et fonctions serveur |

Sens principal des appels :

```text
Page → hook TanStack Query → service d'accès aux données → API Supabase
                                                        ├── PostgreSQL + RLS
                                                        ├── RPC transactionnelle
                                                        └── Edge Function → Auth / Storage / PostgreSQL
```

Les deux applications importent les packages. Un package n'importe jamais une application et une application n'importe jamais l'autre. Les services retournent des données ou des erreurs normalisées ; les toasts appartiennent à l'interface. Le gestionnaire d'erreurs actuel importe Sonner : cette dépendance doit sortir de la couche données.

Configurer le client Supabase pour chaque application. Exposer les modules partagés par entrées ciblées, par exemple `@sacre-coeur/data-access/students`, afin de rendre les dépendances lisibles et d'éviter des imports globaux inutiles.

Une fonctionnalité peut commencer simplement :

```text
apps/admin/src/features/students/
├── pages/StudentsPage.tsx
├── components/StudentForm.tsx
├── components/StudentsTable.tsx
└── hooks/useStudents.ts

packages/domain/src/students/
├── student.types.ts
└── student.schema.ts

packages/data-access/src/students/
├── student.service.ts
└── student.mapper.ts                 # À créer si une conversion est nécessaire
```

Les routes assemblent les pages. Les hooks gèrent chargement, mutations et invalidations. Le service gère la requête. Ajouter un fichier de règles métier seulement lorsqu'il existe des règles à y placer : éviter les couches vides pour chaque petit CRUD.

Le composant `StudentProfile` est utilisé à la fois par l'admin et le parent. Mutualiser ses parties visuelles avec des propriétés explicites, puis conserver un conteneur par application pour les données et actions autorisées. L'autorisation réelle d'une action reste côté serveur.

## 6. Modules métier à expliciter

| Module | Contenu | Base actuelle à reprendre |
| --- | --- | --- |
| Identity | Session, profils, rôles, invitations et comptes | `auth`, `parent`, partie identité de `teacher` |
| Students | Fiche élève et relation avec son responsable | `student/Student.service.ts` |
| Enrollments | Inscription, réinscription, validation et année scolaire | `student/inscription.service.ts` et validation élève |
| Academics | Classes, enseignants, affectations, cours et horaires | `classe`, `teacher`, `course`, `schedule` |
| Grades | Notes, périodes et publication des résultats | `grade` et cotations encore locales |
| Finance | Tarifs, paiements et reçus | `finance` |
| Communication | Annonces et destinataires | `announcement` |
| Reports | Bulletins, palmarès, PDF et archives | `archive`, fonctions PDF, palmarès encore locaux |
| Settings | Paramètres et ouverture des inscriptions | `settings` |

Le même domaine peut avoir une interface parent, enseignant et admin. Ses contrats restent communs ; ses pages et actions dépendent de l'application.

## 7. Session, état et permissions

Adopter trois sources de vérité précises :

- **Supabase Auth** pour la session, avec initialisation au démarrage, vérification de l'utilisateur/profil et écoute des changements. Prévoir les états `loading`, `authenticated` et `anonymous`.
- **TanStack Query** pour les données serveur et leur cache. Utiliser des clés incluant l'utilisateur, l'année scolaire, la classe et les filtres pertinents. Vider le cache lors d'une déconnexion ou d'un changement d'utilisateur.
- **Zustand** pour l'état d'interface : thème, sidebar, filtres locaux, modales et brouillons éventuels. Ne pas y maintenir une seconde base d'élèves, de notes ou de paiements.

La séparation en sous-domaine organise les interfaces. Les droits sur les données restent appliqués par les policies RLS : parent limité à ses enfants, enseignant à ses affectations, admin à la gestion. Protéger également le champ `profiles.role` contre l'auto-attribution de privilèges. Les gardes React servent à la navigation. Voir [les règles RLS Supabase](https://supabase.com/docs/guides/database/postgres/row-level-security).

Le navigateur utilise une clé publishable. Les clés privilégiées restent dans les fonctions serveur : [documentation des clés Supabase](https://supabase.com/docs/guides/getting-started/api-keys).

Pour les commandes d'administration des comptes, vérifier la session et les permissions côté serveur avant toute opération privilégiée. Une fonction appelée depuis le dashboard admin ne devient pas autorisée par sa seule provenance. Voir [la sécurisation des Edge Functions](https://supabase.com/docs/guides/functions/auth).

## 8. Backend et cohérence des données

Garder les lectures et les CRUD simples sur Supabase lorsqu'ils sont protégés par les droits appropriés. Déplacer les commandes qui ont besoin d'une autorité serveur :

- Invitations et gestion d'autres comptes : Edge Functions dédiées et autorisées.
- Validation d'inscription et réinscription : RPC ou logique SQL pour vérifier les conditions et appliquer les changements atomiquement.
- Émission de paiement/reçu : montant, devise, identité de l'auteur et numéro établis côté serveur ; unicité et gestion des doublons.
- Fichiers personnels : Storage privé, politiques d'accès et liens temporaires.

Une succession de requêtes dans une Edge Function n'est pas automatiquement une transaction. Pour un changement atomique de plusieurs tables PostgreSQL, encapsuler l'opération dans une fonction SQL transactionnelle. Les opérations combinant Auth, Storage et base demandent un traitement des échecs partiels.

Versionner le schéma distant existant avant d'introduire de nouvelles migrations. Inclure les policies, fonctions, index et contraintes nécessaires ; vérifier séparément les configurations Auth et Storage. Voir [le workflow de migrations Supabase](https://supabase.com/docs/guides/local-development/database-migrations).

Points métier déjà identifiés :

1. Les statuts `valide`, `accepte`, `refuse` et `rejete` doivent être harmonisés avec le schéma réel. Choisir une seule terminologie puis migrer les données et les types ensemble.
2. `TeacherService.activateAccount` demande un compte `teacher` à une méthode qui n'autorise que `parent`. Remplacer ce parcours par un flux d'invitation/activation vérifié côté serveur.
3. `TeacherService.deleteTeacher` transmet un identifiant à `deleteAccount`, qui attend le mot de passe de l'utilisateur courant. Créer une commande de gestion d'un autre compte, distincte de la suppression de son propre compte.
4. Les affectations existent dans un tableau `assignedclasses` et dans `classe_enseignant`. Retenir la relation comme référence et dériver les listes affichées.
5. L'ouverture des réinscriptions, les transitions et l'appartenance de l'élève doivent être garanties côté base, même si l'interface effectue déjà une vérification.
6. Les corrections ou annulations de paiements doivent laisser une trace auditable et appliquer des droits explicites.

Les contraintes exactes restent à confirmer avec le schéma et les règles de l'école : unicité d'une inscription annuelle active, unicité d'une note par élève/matière/période/année, absence de chevauchement d'horaires. Ne pas ajouter un modèle multi-écoles avant qu'un besoin concret existe ; si ce besoin apparaît, il faudra inclure l'établissement dans toutes les frontières d'accès pertinentes.

## 9. Scalabilité et déploiement

La montée en charge commence par les requêtes et les frontières de livraison :

- Deux builds Vite et deux déploiements ; chaque hébergement renvoie son propre `index.html` pour ses routes SPA.
- Assets servis par CDN et pages chargées progressivement selon les fonctionnalités.
- Listes filtrées et paginées côté serveur, avec index adaptés aux relations, années et filtres réels.
- Agrégations SQL pour les statistiques ; ne pas charger toutes les inscriptions pour compter les élèves.
- Clés de cache structurées et invalidations propres au domaine concerné.
- Contrôles CI : typage, lint, build des applications, règles métier importantes et autorisations base.
- Sauvegardes restaurables et journalisation des opérations administratives utiles.

Exemple actuel : `paymentService.getStudentPayment` lit les paiements sans filtre puis `StudentProfile` filtre localement. Donner au service `studentId` et `schoolYear`, filtrer la requête et paginer si nécessaire. L'index correspondant dépendra du schéma constaté.

Les variables et fichiers de configuration restent propres à chaque application. Configurer les URL de retour de connexion et de récupération de mot de passe pour les deux origines : [documentation des URL de redirection Supabase](https://supabase.com/docs/guides/auth/redirect-urls). En production, utiliser des destinations explicites.

On pourra extraire ultérieurement une API ou un traitement asynchrone si des intégrations, des calculs lourds ou un besoin de déploiement indépendant le justifient. Aucun volume ou objectif de trafic n'étant fourni, cette proposition organise la croissance ; elle ne promet pas une capacité chiffrée.

## 10. Migration progressive

| Étape | Travail | Résultat vérifiable |
| --- | --- | --- |
| 1. Stabiliser | Corriger build/lint et incohérences de contrats actives | Le projet actuel compile et ses parcours essentiels fonctionnent |
| 2. Fiabiliser les données | Capturer le schéma, vérifier les droits et migrer les écrans mock | Un changement côté admin est visible dans les espaces concernés |
| 3. Fiabiliser l'identité | Synchroniser la session et séparer commandes utilisateur/admin | Les rôles et l'expiration de session donnent un comportement cohérent |
| 4. Extraire le commun | Créer les workspaces et les trois packages | Le frontend actuel fonctionne avec les nouveaux imports |
| 5. Séparer l'admin | Créer son app, déplacer ses routes et retirer sa présence du site | Le build du site ne contient aucune page admin ; login admin autonome |
| 6. Déployer séparément | Configurer sous-domaine, routes SPA et retours Auth | Les liens directs et parcours de connexion fonctionnent sur chaque origine |
| 7. Optimiser | Découper les grandes pages, paginer et agréger | Le volume chargé dépend des données utiles à l'écran |

Les premières étapes peuvent avancer par fonctionnalité. Le déplacement des dossiers seul ne corrige pas les sources de données ou les autorisations.

Scénarios de validation prioritaires :

- Parent A ne peut pas lire ou modifier l'enfant du parent B, même via l'API.
- Un enseignant ne peut pas modifier les notes d'une classe non affectée.
- Un parent ne peut pas s'attribuer le rôle admin et n'accède pas à l'admin.
- Une session expirée ne laisse pas apparaître un dashboard connecté.
- Une inscription soumise deux fois ne crée pas un doublon contraire aux règles de l'école.
- Un paiement enregistré dans l'admin est retrouvé par le parent autorisé.
- Aucune sélection ou route admin n'est présente dans l'application du site.

## 11. Vérifications effectuées avant refactoring

- `npm.cmd run build` : échec pendant la vérification TypeScript, avant le build Vite. Problèmes notamment de casse `Dashboard-shell`/`dashboard-shell`, de types obsolètes dans les mocks/store, de `registerStudent` absent et de types de composants UI incompatibles.
- `npm.cmd run lint` : échec avec **19 erreurs et 0 avertissement**.
- Aucun script de test trouvé dans le `package.json`.
- Le `README.md` contient encore le modèle React/Vite ; documenter les applications, les environnements et les commandes au moment de la migration.
- Le `package-lock.json` était déjà modifié avant l'analyse et a été laissé intact.

Ce document conserve l'analyse ayant guidé le refactoring. Le code applicatif a depuis été réorganisé ; les contrôles actuels sont documentés dans le README. Les valeurs du fichier `.env` et le schéma de la base distante n'ont pas été inspectés. Le lockfile a été mis à jour pour les workspaces en conservant les modifications déjà présentes lors de l'analyse.
