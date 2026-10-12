import json,subprocess,os,sys,numpy as np
from scipy.signal import stft
SP=os.environ.get("SND_WORK") or os.path.expanduser("~/bsy-snd-work"); os.makedirs(SP+"/raw",exist_ok=True); os.makedirs(SP+"/out",exist_ok=True); os.makedirs(SP+"/qc",exist_ok=True); SR=22050
def load(fn):
    a=subprocess.run(["ffmpeg","-v","error","-i",fn,"-ac","1","-ar",str(SR),"-f","f32le","-"],capture_output=True).stdout
    return np.frombuffer(a,dtype=np.float32)
def analyse(x):
    f,t,Z=stft(x,SR,nperseg=1024,noverlap=768); S=np.abs(Z)**2+1e-12; L=10*np.log10(S)
    keep=f>=150; f2=f[keep]; L2=L[keep]
    med=np.median(L2,axis=1,keepdims=True); hi=np.percentile(L2,97,axis=1)
    contrast=hi-med[:,0]
    # smooth contrast over frequency and pick band
    k=np.convolve(contrast,np.ones(5)/5,mode="same"); pk=np.argmax(k)
    thr=k[pk]*0.5; lo=pk; hi_=pk
    while lo>0 and k[lo-1]>thr: lo-=1
    while hi_<len(k)-1 and k[hi_+1]>thr: hi_+=1
    band=(f2[lo],f2[hi_])
    ex=np.clip(L2[lo:hi_+1]-med[lo:hi_+1]-6,0,None).sum(axis=0)   # excess energy above noise floor
    ex=np.convolve(ex,np.ones(3)/3,mode="same")
    act=ex>max(np.percentile(ex,60),ex.max()*0.06)
    dead=(S.sum(axis=0)<np.percentile(S.sum(axis=0),50)*1e-3)
    return t,ex,act,band,dead
def choose(t,ex,act,dur,Lmin=8,Lmax=14,dead=None):
    dt=t[1]-t[0]
    if dur<=Lmax+2:
        idx=np.where(act)[0]
        if not len(idx): return 0,dur
        return max(0,t[idx[0]]-0.35), min(dur,t[idx[-1]]+0.6)
    best=None
    Ls=sorted({Lmax,min(11,Lmax),Lmin},reverse=True)
    for L in Ls:
        n=int(L/dt)
        for i in range(0,len(t)-n,4):
            seg=act[i:i+n]; e=ex[i:i+n]
            cover=seg.mean()
            onsets=np.sum(np.diff(seg.astype(int))==1)
            edge=act[i:i+int(.25/dt)].mean()+act[i+n-int(.25/dt):i+n].mean()
            lead=np.argmax(seg) * dt if seg.any() else L
            if dead is not None and dead[i:i+n].any(): continue
            sc=cover*1.0+min(onsets,25)/25*0.8+np.log1p(e.sum())/12-edge*0.6-max(0,lead-0.6)*0.3+ (0.05 if L==Lmax else 0)
            if best is None or sc>best[0]: best=(sc,i,n)
    if best is None: return 0,min(dur,Lmax)
    _,i,n=best
    s=t[i]; e=t[i+n-1]
    # snap start to first activity, end to a gap
    seg=act[i:i+n]; first=np.argmax(seg); s=max(0,t[i+first]-0.35)
    j=i+n-1
    while j>i and act[j] and t[j]-s>Lmin: j-=1
    e=min(dur,t[j]+0.5)
    return s,e
def process(xcid,out,qc):
    fn=f"{SP}/raw/XC{xcid}"; x=load(fn); dur=len(x)/SR
    t,ex,act,band,dead=analyse(x); s,e=choose(t,ex,act,dur,dead=dead)
    cov=act[(t>=s)&(t<=e)].mean() if ((t>=s)&(t<=e)).any() else 0
    if cov<0.2 and dur>9: s,e=choose(t,ex,act,dur,Lmin=8,Lmax=8,dead=dead)
    L=e-s
    hp=max(60,int(band[0]*0.6))
    fi=0.25; fo=min(0.5,L*0.08)
    lp=f"lowpass=f={max(3000,int(band[1]*3))},lowpass=f={max(3000,int(band[1]*3))}," if band[1]<2000 else ""
    af=f"highpass=f={hp},{lp}afade=t=in:st=0:d={fi},afade=t=out:st={L-fo:.2f}:d={fo:.2f},loudnorm=I=-18:TP=-1.5:LRA=11"
    subprocess.run(["ffmpeg","-v","error","-y","-ss",f"{s:.2f}","-t",f"{L:.2f}","-i",fn,"-af",af,"-ac","1","-ar","44100","-c:a","aac","-b:a","64k","-movflags","+faststart",out],check=True)
    subprocess.run(["ffmpeg","-v","error","-y","-i",out,"-lavfi","showspectrumpic=s=900x220:legend=0:scale=log:fscale=lin:stop=11000:color=viridis",qc],check=True)
    return dict(start=round(s,2),sec=round(L,1),band=[int(band[0]),int(band[1])],dur=round(dur,1))
if __name__=="__main__":
    P=json.load(open(f"{SP}/picks.json")); meta={}
    for bid in (sys.argv[1:] or P):
        for k,p in enumerate(P[bid]):
            out=f"{SP}/out/{bid}-{k}.m4a"; qc=f"{SP}/qc/{bid}-{k}.png"
            m=process(p["id"],out,qc); p.update(m); p["src"]=f"snd/{bid}-{k}.m4a"
            print(bid,k,p["cat"],p["q"],m,os.path.getsize(out)//1024,"KB",flush=True)
    json.dump(P,open(f"{SP}/picks.json","w"),ensure_ascii=False,indent=1)
