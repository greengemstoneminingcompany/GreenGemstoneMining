// @vitest-environment jsdom
import { beforeEach,describe,expect,it,vi } from 'vitest';
const mocks=vi.hoisted(()=>({getSession:vi.fn(),signInWithPassword:vi.fn(),signOut:vi.fn(),rpc:vi.fn()}));
vi.mock('@/lib/supabase',()=>({getSupabase:vi.fn(async()=>({auth:{getSession:mocks.getSession,signInWithPassword:mocks.signInWithPassword,signOut:mocks.signOut},rpc:mocks.rpc}))}));
import {applyPublishedVisualEditorPayload,installVisualEditorBridge} from './visualEditorBridge';
describe('visual editor server bridge',()=>{
 beforeEach(()=>{document.body.innerHTML='<div id="root"><main></main></div>';document.getElementById('ggmc-published-design-tokens')?.remove();vi.clearAllMocks();vi.stubEnv('VITE_VISUAL_EDITOR_ENABLED','true');vi.stubEnv('VITE_VISUAL_EDITOR_SUPABASE_REF','previewref');vi.stubEnv('VITE_SUPABASE_URL','https://previewref.supabase.co');installVisualEditorBridge();});
 it('exposes expected server operations without privileged keys',()=>{expect(window.__GGMC_EDITOR_API__).toBeDefined();expect(Object.keys(window.__GGMC_EDITOR_API__??{})).toEqual(expect.arrayContaining(['saveDraft','publishDraft','listDrafts','listVersions','restoreVersion','listTemplates','saveTemplate','deleteTemplate','getSession']));expect(JSON.stringify(window.__GGMC_EDITOR_API__)).not.toMatch(/service.role|secret.key/i);});
 it('fails closed when the configured database is not the dedicated preview project',async()=>{vi.stubEnv('VITE_SUPABASE_URL','https://productionref.supabase.co');await expect(window.__GGMC_EDITOR_API__!.listDrafts()).rejects.toThrow('dedicated preview Supabase project');expect(mocks.rpc).not.toHaveBeenCalled();});
 it('rejects unauthenticated access',async()=>{mocks.getSession.mockResolvedValueOnce({data:{session:null}});await expect(window.__GGMC_EDITOR_API__!.listDrafts()).rejects.toThrow('Sign in');});
 it('rejects non-admin sessions',async()=>{mocks.getSession.mockResolvedValueOnce({data:{session:{user:{email:'visitor@example.com'}}}});mocks.rpc.mockResolvedValueOnce({data:false,error:null});await expect(window.__GGMC_EDITOR_API__!.listDrafts()).rejects.toThrow('not authorised');});
 it('routes shared template CRUD through admin-checked RPCs',async()=>{
  const template={id:'template-1',name:'Partner card',block:{kind:'card',title:'Partner'},created_at:'2026-10-29T00:00:00Z',updated_at:'2026-10-29T00:00:00Z'};
  mocks.getSession.mockResolvedValue({data:{session:{user:{email:'owner@example.com'}}}});
  mocks.rpc.mockResolvedValueOnce({data:true,error:null});
  mocks.rpc.mockResolvedValueOnce({data:[template],error:null});
  mocks.rpc.mockResolvedValueOnce({data:true,error:null});
  mocks.rpc.mockResolvedValueOnce({data:template,error:null});
  mocks.rpc.mockResolvedValueOnce({data:true,error:null});
  mocks.rpc.mockResolvedValueOnce({data:true,error:null});
  const api=window.__GGMC_EDITOR_API__!;
  expect(await api.listTemplates()).toEqual([template]);
  expect(await api.saveTemplate({id:null,name:'Partner card',block:template.block})).toEqual(template);
  expect(await api.deleteTemplate('template-1')).toBe(true);
  expect(mocks.rpc).toHaveBeenNthCalledWith(2,'list_visual_editor_templates');
  expect(mocks.rpc).toHaveBeenNthCalledWith(4,'save_visual_editor_template',{p_id:null,p_name:'Partner card',p_block:template.block});
  expect(mocks.rpc).toHaveBeenNthCalledWith(6,'delete_visual_editor_template',{p_id:'template-1'});
 });
 it('preserves a false shared-template delete result',async()=>{
  mocks.getSession.mockResolvedValue({data:{session:{user:{email:'owner@example.com'}}}});
  mocks.rpc.mockResolvedValueOnce({data:true,error:null});
  mocks.rpc.mockResolvedValueOnce({data:false,error:null});
  await expect(window.__GGMC_EDITOR_API__!.deleteTemplate('already-gone')).resolves.toBe(false);
 });
 it('uses expected version for conflict-safe saves',async()=>{mocks.getSession.mockResolvedValueOnce({data:{session:{user:{email:'owner@example.com'}}}});mocks.rpc.mockResolvedValueOnce({data:true,error:null});mocks.rpc.mockResolvedValueOnce({data:{id:'draft-id',version:2,status:'draft'},error:null});const saved=await window.__GGMC_EDITOR_API__!.saveDraft({id:'draft-id',expectedVersion:1,name:'Website draft',payload:{text:{}}});expect(saved.version).toBe(2);expect(mocks.rpc).toHaveBeenLastCalledWith('save_visual_editor_draft',expect.objectContaining({p_expected_version:1}));});
 it('restores a selected server version into a new draft',async()=>{mocks.getSession.mockResolvedValueOnce({data:{session:{user:{email:'owner@example.com'}}}});mocks.rpc.mockResolvedValueOnce({data:true,error:null});mocks.rpc.mockResolvedValueOnce({data:{id:'restored-id',version:1,status:'draft',payload:{text:{}}},error:null});const restored=await window.__GGMC_EDITOR_API__!.restoreVersion('draft-id',3);expect(restored.id).toBe('restored-id');expect(mocks.rpc).toHaveBeenLastCalledWith('restore_visual_editor_version',{p_draft_id:'draft-id',p_version:3});});

 it('renders all editor block kinds safely in the published snapshot',()=>{
  const root=document.getElementById('root')!;
  applyPublishedVisualEditorPayload({blocks:[
   {id:'section-1',kind:'section',title:'Responsible mining',text:'Section copy'},
   {id:'grid-1',kind:'grid',title:'Operations',text:'First column'},
   {id:'image-1',kind:'image',src:'https://example.com/mine.webp',alt:'Mining site'},
   {id:'video-1',kind:'video',src:'https://example.com/overview.mp4',title:'Overview'},
   {id:'spacer-1',kind:'spacer',height:'48px'},
   {id:'link-1',kind:'link',title:'Contact us',href:'#contact'},
   {id:'divider-1',kind:'divider'},
   {id:'html-1',kind:'html',html:'<p onclick="alert(1)">Safe text</p><script>alert(2)</script>'},
   {id:'card-1',kind:'card',title:'Partner',text:'Card copy'}
  ]},root);
  expect(root.querySelector('.ve-added-section h2')?.textContent).toBe('Responsible mining');
  expect(root.querySelectorAll('.ve-added-grid .ve-added-card')).toHaveLength(2);
  expect(root.querySelector('.ve-added-image')?.getAttribute('alt')).toBe('Mining site');
  expect(root.querySelector('.ve-added-video')?.getAttribute('src')).toContain('overview.mp4');
  expect((root.querySelector('.ve-added-spacer') as HTMLElement).style.height).toBe('48px');
  expect(root.querySelector('.ve-added-link')?.getAttribute('href')).toBe('#contact');
  expect(root.querySelector('hr')).not.toBeNull();
  expect(root.querySelector('.ve-added-html script')).toBeNull();
  expect(root.querySelector('.ve-added-html [onclick]')).toBeNull();
  expect(root.querySelector('.ve-added-card')).not.toBeNull();
 });
 it('validates and applies saved design tokens on the published page',()=>{
  const root=document.getElementById('root')!;
  applyPublishedVisualEditorPayload({designTokens:{brand:'#123456',accent:'url(javascript:alert(1))',surface:'#234567',copy:'#ffffff',radius:18,sectionSpace:72,contentWidth:1280}},root);
  expect(root.style.getPropertyValue('--ggmc-brand')).toBe('#123456');
  expect(root.style.getPropertyValue('--ggmc-accent')).toBe('#c4a252');
  expect(root.style.getPropertyValue('--ggmc-radius')).toBe('18px');
  expect(root.style.getPropertyValue('--ggmc-section-space')).toBe('72px');
  expect(document.getElementById('ggmc-published-design-tokens')).not.toBeNull();
 });

});
