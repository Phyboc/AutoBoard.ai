'use client';

import React, { useState } from 'react';
import { useWidgetState } from '@nitrostack/widgets';

export default function EmployeeFormWidget() {
	const [, setWidgetState] = useWidgetState();

	const [formData, setFormData] = useState({
		name: '',
		email: '',
		role: '',
		startDate: new Date().toISOString().split('T')[0]
	});

	const [loading, setLoading] = useState(false);
	const [responseMessage, setResponseMessage] = useState<string | null>(null);

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setFormData({ ...formData, [e.target.name]: e.target.value });
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setResponseMessage(null);

		try {
			// Call your NitroStack backend tool endpoint
			const res = await fetch('/api/tools/createEmployee', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(formData)
			});

			const result = await res.json();

			if (result.success || res.ok) {
				setResponseMessage(`Successfully created profile for ${formData.name}!`);
				setWidgetState({ toolName: 'createEmployee', input: formData, result });
			} else {
				setResponseMessage(`Error: ${result.message || 'Failed to create employee'}`);
			}
		} catch (err) {
			// Fallback: If direct API route isn't exposed, sync via widget state for the AI agent to process
			setWidgetState({
				toolName: 'createEmployee',
				input: formData,
				status: 'Pending Agent Execution'
			});
			setResponseMessage(`Dispatched to agent pipeline for ${formData.name}.`);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="w-full max-w-xl mx-auto my-3 bg-slate-900 border border-slate-700 rounded-xl shadow-xl overflow-hidden font-sans text-slate-100 select-none">

			{/* Header */}
			<div className="px-5 py-3.5 bg-emerald-950/80 border-b border-emerald-800/60 flex items-center justify-between">
				<div className="flex items-center space-x-2.5">
					<span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
					<h3 className="font-bold text-xs tracking-wider text-emerald-200 uppercase m-0">
						Onboard New Employee
					</h3>
				</div>
				<span className="px-3 py-1 text-xs font-semibold bg-emerald-900 text-emerald-200 rounded-full border border-emerald-700 shadow-sm">
					createEmployee
				</span>
			</div>

			{/* Form Body */}
			<div className="p-6 bg-slate-900">
				{responseMessage ? (
					<div className="p-6 text-center space-y-3 bg-emerald-950/30 border border-emerald-800/50 rounded-lg">
						<div className="w-10 h-10 mx-auto bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center font-bold">✓</div>
						<h4 className="font-semibold text-emerald-200 text-sm">Action Complete</h4>
						<p className="text-xs text-slate-300">{responseMessage}</p>
						<button
							onClick={() => {
								setResponseMessage(null);
								setFormData({ name: '', email: '', role: '', startDate: new Date().toISOString().split('T')[0] });
							}}
							className="mt-2 text-xs px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-600 transition cursor-pointer"
						>
							Create Another
						</button>
					</div>
				) : (
					<form onSubmit={handleSubmit} className="space-y-4">
						<div>
							<label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
								Full Name <span className="text-emerald-400">*</span>
							</label>
							<input
								type="text"
								name="name"
								required
								value={formData.name}
								onChange={handleChange}
								placeholder="e.g. Jane Doe"
								className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition select-text"
							/>
						</div>

						<div>
							<label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
								Email Address
							</label>
							<input
								type="email"
								name="email"
								value={formData.email}
								onChange={handleChange}
								placeholder="Leave blank for auto-generation"
								className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition select-text"
							/>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div>
								<label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
									Job Role <span className="text-emerald-400">*</span>
								</label>
								<input
									type="text"
									name="role"
									required
									value={formData.role}
									onChange={handleChange}
									placeholder="e.g. Software Engineer"
									className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition select-text"
								/>
							</div>

							<div>
								<label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
									Start Date <span className="text-emerald-400">*</span>
								</label>
								<input
									type="date"
									name="startDate"
									required
									value={formData.startDate}
									onChange={handleChange}
									className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition select-text"
								/>
							</div>
						</div>

						<div className="pt-2">
							<button
								type="submit"
								disabled={loading}
								className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white font-semibold text-xs tracking-wider uppercase rounded-lg shadow-md transition duration-200 cursor-pointer"
							>
								{loading ? 'Creating Profile...' : 'Submit & Create Profile'}
							</button>
						</div>
					</form>
				)}
			</div>
		</div>
	);
}