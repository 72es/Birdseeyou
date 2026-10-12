import re,math
KW=[("Taipei City","台北市"),("Taipei","台北市"),("New Taipei","新北市"),("Keelung","基隆市"),("Nuannuan","基隆市"),("Taoyuan","桃園市"),("Hsinchu City","新竹市"),("Hsinchu","新竹縣"),("Miaoli","苗栗縣"),("Taichung","台中市"),("Changhua","彰化縣"),("Nantou","南投縣"),("Jiji","南投縣"),("Yunlin","雲林縣"),("Chiayi City","嘉義市"),("Chiayi","嘉義縣"),("Budai","嘉義縣"),("Tainan","台南市"),("Shanhua","台南市"),("Kaohsiung","高雄市"),("Pingtung","屏東縣"),("Kenting","屏東縣"),("Yilan","宜蘭縣"),("Hualien","花蓮縣"),("花蓮","花蓮縣"),("Taitung","台東縣"),("Penghu","澎湖縣"),("Kinmen","金門縣"),("Dongyin","連江縣"),("Matsu","連江縣"),("Lienchiang","連江縣"),("台北","台北市"),("新北","新北市"),("宜蘭","宜蘭縣"),("台東","台東縣"),("臺東","台東縣"),("南投","南投縣"),("嘉義","嘉義縣"),("屏東","屏東縣"),("高雄","高雄市"),("台中","台中市"),("臺中","台中市"),("新竹","新竹縣"),("苗栗","苗栗縣"),("雲林","雲林縣"),("彰化","彰化縣"),("台南","台南市"),("臺南","台南市"),("桃園","桃園市"),("基隆","基隆市")]
SEAT={"台北市":(25.04,121.56),"新北市":(25.01,121.46),"基隆市":(25.13,121.74),"桃園市":(24.99,121.30),"新竹縣":(24.83,121.01),"苗栗縣":(24.56,120.82),"台中市":(24.15,120.67),"彰化縣":(24.08,120.54),"南投縣":(23.91,120.68),"雲林縣":(23.71,120.43),"嘉義縣":(23.45,120.26),"台南市":(23.0,120.2),"高雄市":(22.63,120.30),"屏東縣":(22.67,120.49),"宜蘭縣":(24.75,121.75),"花蓮縣":(23.99,121.6),"台東縣":(22.76,121.14),"連江縣":(26.15,119.95),"金門縣":(24.43,118.32),"澎湖縣":(23.57,119.58)}
COUNTRY={"Japan":"日本","South Korea":"韓國","China":"中國","Hong Kong":"香港","Philippines":"菲律賓","Russian Federation":"俄羅斯","Mongolia":"蒙古","Vietnam":"越南","Thailand":"泰國","Malaysia":"馬來西亞","Indonesia":"印尼","India":"印度","United Kingdom":"英國","Netherlands":"荷蘭","Germany":"德國","France":"法國","Spain":"西班牙","Sweden":"瑞典","Poland":"波蘭","United States":"美國","Australia":"澳洲"}
def city(p):
    if p.get("cnt")!="Taiwan": return COUNTRY.get(p.get("cnt"),p.get("cnt") or "")
    loc=p.get("loc") or ""
    for k,v in KW:
        if k in loc: return v
    try:
        la,lo=float(p["lat"]),float(p["lon"])
        return min(SEAT,key=lambda c:(SEAT[c][0]-la)**2+((SEAT[c][1]-lo)*math.cos(math.radians(la)))**2)
    except: return "台灣"
