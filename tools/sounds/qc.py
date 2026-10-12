import json,sys,os,numpy as np
from PIL import Image,ImageDraw
from scipy.signal import stft
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
from cut import load,analyse,SR
SP=os.environ.get("SND_WORK") or os.path.expanduser("~/bsy-snd-work"); os.makedirs(SP+"/raw",exist_ok=True); os.makedirs(SP+"/out",exist_ok=True); os.makedirs(SP+"/qc",exist_ok=True)
def spec(fn,W=900,H=200):
    x=load(fn); f,t,Z=stft(x,SR,nperseg=512,noverlap=384); L=20*np.log10(np.abs(Z)+1e-9)
    L=L[f<=11000]; mx=np.percentile(L,99.7); L=np.clip((L-(mx-55))/55,0,1)
    img=Image.fromarray((255*(1-L[::-1])).astype(np.uint8)).resize((W,H))
    _,ex,act,_,_=analyse(x)
    return img.convert("RGB"),act.mean(),len(x)/SR
P=json.load(open(f"{SP}/picks.json"))
ids=sys.argv[1:] or list(P)
for b in ids:
    ps=P[b]; Hh=222; img=Image.new("RGB",(900,Hh*len(ps)),"white"); d=ImageDraw.Draw(img)
    for k,p in enumerate(ps):
        im,cov,dur=spec(f"{SP}/out/{b}-{k}.m4a"); p["cover"]=round(float(cov),2)
        img.paste(im,(0,k*Hh+22)); d.text((4,k*Hh+5),f"{b}-{k} | {p['type']} | q{p['q']} | {dur:.1f}s | cover {cov:.2f} | also {len(p['also'] or [])} | XC{p['id']}",fill="black")
    img.save(f"{SP}/sheet_{b}.png")
json.dump(P,open(f"{SP}/picks.json","w"),ensure_ascii=False,indent=1)
