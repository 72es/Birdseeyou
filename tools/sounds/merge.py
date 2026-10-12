import json,shutil,os,re,glob
from city import city as city0
def city(p):
    try: la,lo=float(p["lat"]),float(p["lon"])
    except: la=lo=None
    if "Meishan" in (p.get("loc") or "") and la and la<23.4: return "高雄市"
    c=city0(p)
    if c=="台北市" and la and not (24.96<=la<=25.21 and 121.45<=lo<=121.67) and "Taipei" not in p["loc"]: c="新北市"
    if c=="連江縣": c="馬祖"
    return c
REPO=os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))); SP=os.environ.get("SND_WORK") or os.path.expanduser("~/bsy-snd-work"); os.chdir(SP); os.makedirs(REPO+"/snd",exist_ok=True)
P=json.load(open("picks.json")); D=json.load(open(REPO+"/data/birds.json"))
KIND={"唱歌":"唱歌","叫聲":"叫聲","警戒":"警戒聲","飛行":"飛行聲","敲擊":"敲擊聲"}
for f in glob.glob(REPO+"/snd/*.m4a"):
    if os.path.basename(f).rsplit("-",1)[0] in P: os.remove(f)
for b in D["birds"]:
    if b["id"] not in P: continue
    out=[]
    for i,p in enumerate(P[b["id"]][:5]):
        assert not re.search(r"licenses/[a-z-]*nd",p["lic"]), p["id"]
        k=int(re.search(r"-(\d+)\.m4a$",p["src"]).group(1))
        dst=f"snd/{b['id']}-{i}.m4a"; shutil.copyfile(f"out/{b['id']}-{k}.m4a",f"{REPO}/{dst}")
        m=re.search(r"licenses/([a-z-]+)/([\d.]+)",p["lic"])
        out.append({"src":dst,"kind":KIND[p["cat"]],"sec":round(p["sec"]),"city":city(p),"by":p["rec"],"license":"CC "+m.group(1).upper()+" "+m.group(2),"licUrl":p["lic"] if p["lic"].startswith("http") else "https:"+p["lic"],"url":p["url"],"xc":"XC"+p["id"]})
    b["sounds"]=out
    print(b["zh"],[(s["kind"],s["sec"],s["city"],s["license"]) for s in out])
json.dump(D,open(REPO+"/data/birds.json","w"),ensure_ascii=False,indent=1)
