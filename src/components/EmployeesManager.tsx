import { useState, useEffect } from 'react';
import { Users, Plus, Edit2, Trash2, Save, X, Search, DollarSign, Mail, Phone, Briefcase, UserPlus, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Employee, Service } from '../types';
import { formatCurrency } from '../utils/pricing';

export const EmployeesManager = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    skills: [] as string[],
    hourly_rate: 0,
    active: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [employeesResult, servicesResult] = await Promise.all([
      supabase.from('employees').select('*').order('nombre', { ascending: true }),
      supabase.from('services').select('*').eq('activo', true),
    ]);

    if (employeesResult.data) setEmployees(employeesResult.data as Employee[]);
    if (servicesResult.data) setServices(servicesResult.data as Service[]);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingId) {
        await supabase.from('employees').update(formData).eq('id', editingId);
        setEditingId(null);
        alert('Employee updated successfully!');
      } else {
        if (!formData.telefono) {
          alert('Phone number is required to create login credentials.');
          return;
        }

        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.telefono,
          options: {
            data: {
              nombre: formData.nombre,
              role: 'employee',
            },
          },
        });

        if (authError) throw authError;

        if (!authData.user) {
          throw new Error('Failed to create user account');
        }

        const { error: userError } = await supabase.from('users').insert([
          {
            id: authData.user.id,
            email: formData.email,
            role: 'employee',
            nombre: formData.nombre,
            telefono: formData.telefono,
            idioma_preferido: 'en',
          },
        ]);

        if (userError) throw userError;

        const { error: employeeError } = await supabase.from('employees').insert([
          {
            ...formData,
            user_id: authData.user.id,
          },
        ]);

        if (employeeError) throw employeeError;

        alert(
          `Employee created successfully!\n\n` +
          `Login credentials:\n` +
          `Email: ${formData.email}\n` +
          `Password: ${formData.telefono}\n\n` +
          `The employee can now login and should change their password after first login.`
        );
        setShowAddForm(false);
      }

      resetForm();
      loadData();
    } catch (error: any) {
      console.error('Error saving employee:', error);
      alert('Error: ' + error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this employee?')) {
      await supabase.from('employees').delete().eq('id', id);
      loadData();
    }
  };

  const handleEdit = (employee: Employee) => {
    setFormData({
      nombre: employee.nombre,
      email: employee.email,
      telefono: employee.telefono,
      skills: employee.skills || [],
      hourly_rate: employee.hourly_rate,
      active: employee.active,
    });
    setEditingId(employee.id);
    setShowAddForm(false);
  };

  const toggleActive = async (employee: Employee) => {
    await supabase
      .from('employees')
      .update({ active: !employee.active })
      .eq('id', employee.id);
    loadData();
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      email: '',
      telefono: '',
      skills: [],
      hourly_rate: 0,
      active: true,
    });
    setEditingId(null);
    setShowAddForm(false);
  };

  const toggleSkill = (serviceName: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(serviceName)
        ? prev.skills.filter(s => s !== serviceName)
        : [...prev.skills, serviceName]
    }));
  };

  const filteredEmployees = employees.filter(emp =>
    emp.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-400 rounded-xl flex items-center justify-center">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Employee Management</h2>
            <p className="text-gray-600">Manage your team members and their skills</p>
          </div>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowAddForm(true);
          }}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:shadow-lg hover:shadow-emerald-500/50 transition-all font-semibold"
        >
          <Plus className="w-5 h-5" />
          Add Employee
        </button>
      </div>

      <div className="bg-white/60 backdrop-blur-sm border border-gray-200 rounded-2xl p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search employees by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>
      </div>

      {(showAddForm || editingId) && (
        <div className="bg-white/80 backdrop-blur-sm border border-emerald-200 rounded-[2rem] shadow-xl p-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-900">
              {editingId ? 'Edit Employee' : 'Add New Employee'}
            </h3>
            <button
              onClick={resetForm}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="w-4 h-4 inline mr-1" />
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone className="w-4 h-4 inline mr-1" />
                  Phone
                </label>
                <input
                  type="tel"
                  required
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <DollarSign className="w-4 h-4 inline mr-1" />
                  Hourly Rate
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={formData.hourly_rate}
                  onChange={(e) => setFormData({ ...formData, hourly_rate: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                <Briefcase className="w-4 h-4 inline mr-1" />
                Skills & Services
              </label>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                {services.map((service) => (
                  <label
                    key={service.id}
                    className={`flex items-center gap-2 p-3 border rounded-xl cursor-pointer transition-all ${
                      formData.skills.includes(service.nombre_en)
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-700'
                        : 'bg-white border-gray-200 hover:border-emerald-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.skills.includes(service.nombre_en)}
                      onChange={() => toggleSkill(service.nombre_en)}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-sm font-medium">{service.nombre_en}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="active"
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <label htmlFor="active" className="text-sm font-medium text-gray-700">
                Active Employee
              </label>
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:shadow-lg hover:shadow-emerald-500/50 transition-all font-semibold"
              >
                <Save className="w-5 h-5" />
                {editingId ? 'Update' : 'Create'} Employee
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-semibold"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid gap-4">
        {filteredEmployees.length === 0 ? (
          <div className="bg-white/60 backdrop-blur-sm border border-gray-200 rounded-[2rem] p-12 text-center">
            <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">No employees found</p>
          </div>
        ) : (
          filteredEmployees.map((employee) => (
            <div
              key={employee.id}
              className={`bg-white/60 backdrop-blur-sm border rounded-2xl p-6 hover:shadow-lg transition-all ${
                employee.active ? 'border-gray-200' : 'border-gray-300 opacity-60'
              }`}
            >
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-xl font-bold text-gray-900">{employee.nombre}</h3>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        employee.active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {employee.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="w-4 h-4 text-gray-400" />
                      {employee.email}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="w-4 h-4 text-gray-400" />
                      {employee.telefono}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <DollarSign className="w-4 h-4 text-gray-400" />
                      {formatCurrency(employee.hourly_rate)}/hour
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Briefcase className="w-4 h-4 text-gray-400" />
                      {employee.skills.length} skills
                    </div>
                  </div>

                  {employee.skills.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {employee.skills.map((skill) => (
                        <span
                          key={skill}
                          className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-xl text-sm font-medium">
                    <CheckCircle className="w-4 h-4" />
                    Login Enabled
                  </div>
                  <button
                    onClick={() => toggleActive(employee)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      employee.active
                        ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {employee.active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => handleEdit(employee)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-200 transition-all text-sm font-medium"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(employee.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 transition-all text-sm font-medium"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {filteredEmployees.length > 0 && (
        <div className="bg-white/60 backdrop-blur-sm border border-gray-200 rounded-2xl p-6">
          <div className="grid sm:grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-3xl font-bold text-emerald-600">{employees.length}</p>
              <p className="text-sm text-gray-600">Total Employees</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-green-600">
                {employees.filter(e => e.active).length}
              </p>
              <p className="text-sm text-gray-600">Active</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-600">
                {employees.filter(e => !e.active).length}
              </p>
              <p className="text-sm text-gray-600">Inactive</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
