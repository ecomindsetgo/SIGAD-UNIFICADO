#!/usr/bin/env python3
"""SIGAD recovery: run only in an authorized Cloud Shell session. No secrets on disk."""
import json, subprocess, secrets, string, urllib.request, urllib.error, getpass
PROJECT='sipa-d4ec9'
ROOT='MmniSKpNWPN2saVja2wVTPaiBnn2'
def token():
    return subprocess.check_output(['gcloud','auth','print-access-token'],text=True).strip()
def request(url, body=None, method=None):
    headers={'Authorization':'Bearer '+token(),'x-goog-user-project':PROJECT,'Content-Type':'application/json'}
    raw=None if body is None else json.dumps(body).encode()
    req=urllib.request.Request(url,headers=headers,data=raw,method=method or ('POST' if raw else 'GET'))
    try:
        with urllib.request.urlopen(req,timeout=30) as r: return json.load(r)
    except urllib.error.HTTPError as e:
        try: detail=json.loads(e.read().decode()).get('error',{}).get('message','')
        except Exception: detail=str(e)
        raise RuntimeError(f'API {e.code}: {detail}') from None

def main():
    active=subprocess.check_output(['gcloud','config','get-value','project'],text=True,stderr=subprocess.DEVNULL).strip()
    if active!=PROJECT: raise RuntimeError('Proyecto incorrecto: '+active)
    print('SIGAD — Recuperación excepcional (Cloud Shell)')
    email=input('Correo del trabajador: ').strip().lower()
    result=request(f'https://identitytoolkit.googleapis.com/v1/projects/{PROJECT}/accounts:lookup',{'email':[email]})
    users=result.get('users',[])
    if len(users)!=1: raise RuntimeError('No se encontró una única cuenta. No se realizaron cambios.')
    u=users[0]; uid=u['localId']
    if uid==ROOT: raise RuntimeError('Cuenta de Administrador General protegida; usa recuperación personal.')
    if u.get('disabled'): raise RuntimeError('La cuenta está deshabilitada. Revisar antes de continuar.')
    path=f'projects/{PROJECT}/databases/(default)/documents/usuarios/{uid}'
    profile=request('https://firestore.googleapis.com/v1/'+path)
    print('Correo:',u.get('email'),'UID:',uid,'Perfil:',profile.get('name','').split('/')[-1]); print('Confirma por un canal confiable la identidad y la solicitud del trabajador.')
    if input('Escribe RESTABLECER para continuar: ')!='RESTABLECER': print('Cancelado.');return
    alphabet=string.ascii_letters+string.digits+'!@#%_-'
    pw=''.join(secrets.choice(alphabet) for _ in range(20))
    # Set marker first: if updating the password fails, the original password still works but the gate will require reset.
    request('https://firestore.googleapis.com/v1/'+path+'?updateMask.fieldPaths=cambioClavePendiente',{'fields':{'cambioClavePendiente':{'booleanValue':True}}},'PATCH')
    try:
        request(f'https://identitytoolkit.googleapis.com/v1/projects/{PROJECT}/accounts:update',{'localId':uid,'password':pw})
    except Exception:
        print('AVISO: se marcó el cambio como pendiente pero no se pudo establecer la contraseña. Revisar el perfil antes de reintentar.')
        raise
    print('\nCONTRASEÑA TEMPORAL (muéstrala al trabajador por canal autorizado):',pw)
    print('UID conservado:',uid)
    print('El trabajador debe iniciar sesión y cambiarla en SIGAD. No compartas esta terminal.')
if __name__=='__main__':
    try: main()
    except Exception as e: print('ERROR:',e);raise SystemExit(1)
