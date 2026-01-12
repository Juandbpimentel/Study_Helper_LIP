import { FormEvent, useState } from "react";
import { Book, Plus, Trash2, Palette, Edit, Check, X } from "lucide-react";
import { TemaDeEstudo } from "@/types/types";

interface SubjectManagerProps {
  subjects: TemaDeEstudo[];
  onAdd: (data: { tema: string; cor: string }) => void;
  onUpdate: (id: number, data: { tema: string; cor: string }) => void;
  onDelete: (id: number) => void;
}

// Sub-componente para o formulário de edição
function SubjectEditForm({
  subject,
  onSave,
  onCancel,
}: {
  subject: TemaDeEstudo;
  onSave: (data: { tema: string; cor: string }) => void;
  onCancel: () => void;
}) {
  const [editedSubject, setEditedSubject] = useState({
    tema: subject.tema,
    cor: subject.cor || "#6366f1",
  });

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    if (!editedSubject.tema.trim()) return;
    onSave(editedSubject);
  };

  return (
    <form
      onSubmit={handleSave}
      className="p-3 bg-indigo-50 rounded-xl border border-indigo-200"
    >
      <div className="flex items-center gap-3">
        <div className="relative shrink-0">
          <input
            type="color"
            value={editedSubject.cor}
            onChange={(e) =>
              setEditedSubject({ ...editedSubject, cor: e.target.value })
            }
            className="h-10 w-10 p-1 rounded-lg border border-slate-200 cursor-pointer shadow-sm"
          />
          <Palette className="w-4 h-4 text-slate-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none mix-blend-difference text-white" />
        </div>
        <input
          type="text"
          className="flex-1 min-w-0 px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700"
          value={editedSubject.tema}
          onChange={(e) =>
            setEditedSubject({ ...editedSubject, tema: e.target.value })
          }
          autoFocus
        />
        <button
          type="submit"
          className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors shadow-sm cursor-pointer"
          title="Salvar"
        >
          <Check className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="p-2 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300 transition-colors cursor-pointer"
          title="Cancelar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </form>
  );
}

export function SubjectManager({
  subjects,
  onAdd,
  onUpdate,
  onDelete,
}: SubjectManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newSubject, setNewSubject] = useState({ tema: "", cor: "#6366f1" });
  const [editingSubjectId, setEditingSubjectId] = useState<number | null>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!newSubject.tema.trim()) return;
    onAdd(newSubject);
    setNewSubject({ tema: "", cor: "#6366f1" });
    setIsAdding(false);
  };

  const handleUpdate = (id: number, data: { tema: string; cor: string }) => {
    onUpdate(id, data);
    setEditingSubjectId(null);
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
            <Book className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-bold text-slate-800">Disciplinas</h2>
        </div>

        {!isAdding && !editingSubjectId && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-transform transform active:scale-95 shadow-sm shadow-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Nova
          </button>
        )}
      </div>

      {isAdding && (
        <form
          onSubmit={handleSubmit}
          className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200 animate-in fade-in slide-in-from-top-2"
        >
          <div className="flex gap-3">
            <div className="relative shrink-0">
              <input
                type="color"
                value={newSubject.cor}
                onChange={(e) =>
                  setNewSubject({ ...newSubject, cor: e.target.value })
                }
                className="h-[42px] w-[42px] p-1 rounded-lg border border-slate-200 cursor-pointer shadow-sm"
              />
              <Palette className="w-4 h-4 text-slate-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none mix-blend-difference text-white" />
            </div>
            <input
              type="text"
              placeholder="Nome da disciplina"
              className="flex-1 min-w-0 px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 placeholder:text-slate-400"
              value={newSubject.tema}
              onChange={(e) =>
                setNewSubject({ ...newSubject, tema: e.target.value })
              }
              autoFocus
            />
            <button
              type="submit"
              disabled={!newSubject.tema.trim()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium text-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-indigo-200 transition-transform transform active:scale-95 cursor-pointer"
            >
              Salvar
            </button>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 text-slate-500 hover:bg-slate-200 hover:text-slate-700 rounded-lg font-medium text-sm transition-colors cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {subjects.length === 0 && !isAdding ? (
          <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <Book className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500 text-sm font-medium">
              Nenhuma disciplina cadastrada.
            </p>
            <p className="text-slate-400 text-xs">
              Adicione matérias para começar a organizar seus estudos.
            </p>
          </div>
        ) : (
          subjects.map((subject) =>
            editingSubjectId === subject.id ? (
              <SubjectEditForm
                key={subject.id}
                subject={subject}
                onSave={(data) => handleUpdate(subject.id, data)}
                onCancel={() => setEditingSubjectId(null)}
              />
            ) : (
              <div
                key={subject.id}
                className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl group transition-all duration-200 border border-transparent hover:border-slate-100"
              >
                <div className="flex items-center gap-3 flex-grow">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: subject.cor }}
                  />
                  <span className="font-medium text-slate-700">
                    {subject.tema}
                  </span>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setEditingSubjectId(subject.id)}
                    className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-100 rounded-lg transition-all transform active:scale-95 cursor-pointer"
                    title="Editar disciplina"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDelete(subject.id)}
                    className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-100 rounded-lg transition-all transform active:scale-95 cursor-pointer"
                    title="Excluir disciplina"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          )
        )}
      </div>
    </div>
  );
}
