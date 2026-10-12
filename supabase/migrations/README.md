# Schéma de la base existante

Le dépôt initial ne contenait aucun schéma SQL, migration, définition de policy RLS ou fonction `delete_user_account`. Le refactoring conserve les tables et colonnes utilisées par les services. Aucun SQL de création ou d'autorisation n'a été déduit des seuls types frontend.

Avant de déployer des évolutions de base, lier le projet réel avec la CLI Supabase, capturer son schéma et vérifier localement les migrations obtenues. Ne pas lancer une réinitialisation sur la base de production. Vérifier également les paramètres Auth et les buckets Storage, qui ne sont pas entièrement décrits par les services.

Les contrôles TypeScript et les tests du dépôt ne certifient pas les permissions de la base distante. Les policies doivent notamment protéger `profiles.role`, les enfants de chaque parent, les classes affectées via `enseignants_details.assignedclasses`, les notes et les paiements.

Voir [le workflow officiel de migrations](https://supabase.com/docs/guides/local-development/database-migrations).
