import EditMealForm from './EditMealForm';

export default function EditMealPage({ params }: { params: { id: string } }) {
  return <EditMealForm mealId={params.id} />;
} 