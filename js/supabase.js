// Supabase DB operations - uses getSB() getter defined in index.html
function sb() { return getSB(); }
function setSyncing(){document.querySelectorAll('.sync-dot').forEach(d=>d.classList.add('syncing'));const t=$('sync-txt');if(t)t.textContent='Syncing...';}
function setSynced(){document.querySelectorAll('.sync-dot').forEach(d=>d.classList.remove('syncing'));const t=$('sync-txt');if(t)t.textContent='Synced';}

async function sbGetProfile(uid){return sb().from('profiles').select('*').eq('id',uid).single();}
async function sbUpsertProfile(p){setSyncing();const r=await sb().from('profiles').upsert(p,{onConflict:'id'});setSynced();return r;}
async function sbSavePlan(uid,type,data){setSyncing();const r=await sb().from('plans').upsert({user_id:uid,type,plan_data:data,updated_at:new Date().toISOString()},{onConflict:'user_id,type'});setSynced();return r;}
async function sbGetPlan(uid,type){return sb().from('plans').select('*').eq('user_id',uid).eq('type',type).order('created_at',{ascending:false}).limit(1).single();}
async function sbGetFoodLog(uid,date){return sb().from('food_logs').select('*').eq('user_id',uid).eq('log_date',date).single();}
async function sbSaveFoodLog(uid,date,data){setSyncing();const r=await sb().from('food_logs').upsert({user_id:uid,log_date:date,log_data:data,updated_at:new Date().toISOString()},{onConflict:'user_id,log_date'});setSynced();return r;}
async function sbLogWorkout(uid,date,key){setSyncing();const r=await sb().from('workout_logs').upsert({user_id:uid,workout_date:date,day_key:key,completed_at:new Date().toISOString()},{onConflict:'user_id,workout_date'});setSynced();return r;}
async function sbGetWorkoutLogs(uid,weeks){const since=new Date();since.setDate(since.getDate()-(weeks||13)*7);return sb().from('workout_logs').select('workout_date').eq('user_id',uid).gte('workout_date',since.toISOString().split('T')[0]).order('workout_date',{ascending:true});}
async function sbGetPRs(uid){return sb().from('personal_records').select('*').eq('user_id',uid).order('created_at',{ascending:false});}
async function sbAddPR(uid,exercise,weight,reps){setSyncing();const r=await sb().from('personal_records').insert({user_id:uid,exercise,weight_kg:weight,reps,created_at:new Date().toISOString()});setSynced();return r;}
async function sbDeletePR(id){return sb().from('personal_records').delete().eq('id',id);}
async function sbSearchUser(username){return sb().from('profiles').select('id,username,avatar_url').eq('username',username).single();}
async function sbSendFriendRequest(from,to){setSyncing();const r=await sb().from('friendships').insert({user_id:from,friend_id:to,status:'pending'});setSynced();return r;}
async function sbGetFriends(uid){return sb().from('friendships').select(`id,status,user_id,friend_id,friend:profiles!friendships_friend_id_fkey(id,username,avatar_url),requester:profiles!friendships_user_id_fkey(id,username,avatar_url)`).or(`user_id.eq.${uid},friend_id.eq.${uid}`).eq('status','accepted');}
async function sbGetFriendRequests(uid){return sb().from('friendships').select(`id,user_id,requester:profiles!friendships_user_id_fkey(id,username)`).eq('friend_id',uid).eq('status','pending');}
async function sbRespondToRequest(id,accept){setSyncing();const r=await sb().from('friendships').update({status:accept?'accepted':'rejected'}).eq('id',id);setSynced();return r;}
async function sbGetLeaderboard(ids){return sb().from('profiles').select('id,username,streak,points,total_workout_days,avatar_url').in('id',ids);}
async function sbUploadStory(uid,file){setSyncing();const fn=`${uid}/${Date.now()}.jpg`;const{error}=await sb().storage.from('workout-stories').upload(fn,file,{contentType:'image/jpeg',upsert:false});if(error){setSynced();return{error};}const{data:u}=sb().storage.from('workout-stories').getPublicUrl(fn);const exp=new Date();exp.setHours(exp.getHours()+24);const r=await sb().from('workout_stories').insert({user_id:uid,image_url:u.publicUrl,storage_path:fn,expires_at:exp.toISOString()});setSynced();return{...r,url:u.publicUrl};}
async function sbGetStories(uid){return sb().from('workout_stories').select('*').eq('user_id',uid).gte('expires_at',new Date().toISOString()).order('created_at',{ascending:false});}
async function sbGetFriendStories(ids){return sb().from('workout_stories').select('*,user:profiles!workout_stories_user_id_fkey(username,avatar_url)').in('user_id',ids).gte('expires_at',new Date().toISOString()).order('created_at',{ascending:false});}
async function sbUploadAvatar(uid,file){setSyncing();const fn=`${uid}/avatar.jpg`;const{error}=await sb().storage.from('avatars').upload(fn,file,{contentType:'image/jpeg',upsert:true});if(error){setSynced();return{error};}const{data:u}=sb().storage.from('avatars').getPublicUrl(fn);setSynced();return{url:u.publicUrl+'?t='+Date.now()};}
async function sbGetTemplates(uid){return sb().from('meal_templates').select('*').eq('user_id',uid).order('created_at',{ascending:false}).limit(8);}
async function sbSaveTemplate(uid,name,data){setSyncing();const r=await sb().from('meal_templates').insert({user_id:uid,name,template_data:data});setSynced();return r;}
async function sbDeleteTemplate(id){return sb().from('meal_templates').delete().eq('id',id);}
