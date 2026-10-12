import { PageHeader } from '@sacre-coeur/ui/layouts/dashboard-shell'
import { Plus } from 'lucide-react'
import { SettingsList } from '../components/SettingsList'
import { SettingFormDialog } from '../components/SettingFormDialog'
import { useAdminSettingsPage } from '../hooks/useAdminSettingsPage'

export function AdminSettings() {
  const page = useAdminSettingsPage()
  return <div className="relative">
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><PageHeader title="Paramètres de la plateforme" subtitle="Gérez les accès, les règles d'inscription et la configuration globale." /><button onClick={() => page.setIsModalOpen(true)} className="flex h-11 items-center justify-center gap-2 self-start rounded-xl bg-primary px-5 font-medium text-primary-foreground transition-opacity hover:opacity-90 sm:self-auto"><Plus className="size-5" />Nouveau paramètre</button></div>
    <SettingsList settings={page.settings} isLoading={page.isLoading} isError={page.isError} isSaving={page.toggleMutation.isPending} onToggle={page.toggle} />
    <SettingFormDialog isOpen={page.isModalOpen} newKey={page.newKey} newLabel={page.newLabel} newDescription={page.newDescription} isSaving={page.createMutation.isPending} onKeyChange={page.setNewKey} onLabelChange={page.setNewLabel} onDescriptionChange={page.setNewDescription} onClose={page.closeModal} onSubmit={page.submit} />
  </div>
}

export default AdminSettings
