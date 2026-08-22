import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { UserServerData, SERVER_IDS, SERVER_NAMES, CITY_NAMES } from '@/models/UserServerData';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const discordId = searchParams.get('discordId');

    if (!discordId) {
      return NextResponse.json({ success: false, error: 'Discord ID requerido' }, { status: 400 });
    }

    const db = await connectToDatabase();
    const serverData = await db.collection('userServerData').findOne({ discordId });
    
    if (!serverData) {
      return NextResponse.json({ 
        success: true, 
        data: null,
        message: 'No hay datos de servidores para este usuario'
      });
    }

    return NextResponse.json({ 
      success: true, 
      data: serverData 
    });

  } catch (error) {
    console.error('Error obteniendo datos de servidores:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Error obteniendo datos de servidores' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { discordId, serverJoins, currentCity } = body;

    if (!discordId) {
      return NextResponse.json({ success: false, error: 'Discord ID requerido' }, { status: 400 });
    }

    const db = await connectToDatabase();
    const existingData = await db.collection('userServerData').findOne({ discordId });
    const now = new Date();
    const updateData: Partial<UserServerData> = {
      discordId,
      serverJoins: serverJoins || {},
      currentCity: currentCity || undefined,
      updatedAt: now
    };

    let result;
    if (existingData) {
      result = await db.collection('userServerData').updateOne(
        { discordId },
        { $set: updateData }
      );
    } else {
      const newServerData: UserServerData = {
        discordId,
        serverJoins: serverJoins || {},
        currentCity: currentCity || undefined,
        createdAt: now,
        updatedAt: now
      };
      result = await db.collection('userServerData').insertOne(newServerData);
    }

    return NextResponse.json({ 
      success: true, 
      message: existingData ? 'Datos actualizados' : 'Datos creados',
      data: result
    });

  } catch (error) {
    console.error('Error guardando datos de servidores:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Error guardando datos de servidores' 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { discordId, serverId, serverName, joinedAt, isActive } = body;

    if (!discordId || !serverId || !joinedAt) {
      return NextResponse.json({ 
        success: false, 
        error: 'Discord ID, Server ID y fecha de unión son requeridos' 
      }, { status: 400 });
    }

    const db = await connectToDatabase();
    
    const serverJoinData = {
      serverId,
      serverName: serverName || SERVER_NAMES[serverId] || 'Servidor Desconocido',
      joinedAt: new Date(joinedAt),
      isActive: isActive !== false
    };

    let updateField = {};
    if (serverId === SERVER_IDS.ERLCHUB) {
      updateField = { 'serverJoins.erlchub': serverJoinData };
    } else if (serverId === SERVER_IDS.LOS_SANTOS) {
      updateField = { 'serverJoins.losSantos': serverJoinData };
    }

    const result = await db.collection('userServerData').updateOne(
      { discordId },
      { 
        $set: {
          ...updateField,
          updatedAt: new Date()
        }
      },
      { upsert: true }
    );

    return NextResponse.json({ 
      success: true, 
      message: 'Fecha de unión actualizada',
      data: result
    });

  } catch (error) {
    console.error('Error actualizando fecha de unión:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Error actualizando fecha de unión' 
    }, { status: 500 });
  }
}