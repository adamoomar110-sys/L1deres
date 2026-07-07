console.log('Environment variable keys:', Object.keys(process.env).filter(k => !k.startsWith('npm_') && !k.startsWith('VSCODE_') && !k.startsWith('GIT_')));
console.log('SUPABASE envs:', Object.keys(process.env).filter(k => k.toLowerCase().includes('supabase') || k.toLowerCase().includes('db') || k.toLowerCase().includes('postgres') || k.toLowerCase().includes('sql')));
